'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  collection, 
  serverTimestamp, 
  doc, 
  runTransaction
} from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { useAuth } from '@/src/hooks/useAuth';
import { 
  enhancePrompt, 
  generateCurriculum,
  listTopics, 
  curateReferences, 
  structureRoadmap, 
  curateContent 
} from '@/src/services/geminiService';
import { Source } from '@/src/types';
import { getOptimizedTopicSources } from '@/src/lib/sourceHelper';
import { cn } from '@/src/lib/utils';
import { Sparkles, AlertCircle, LogIn, CheckCircle2 } from 'lucide-react';

/**
 * Single-call curriculum (40 topics) instead of three sequential agents.
 * `NEXT_PUBLIC_CURRICULUM_V2="0"` restores the legacy pipeline.
 */
const CURRICULUM_V2 = process.env.NEXT_PUBLIC_CURRICULUM_V2 !== '0';

function CreateRoadmapContent() {
  const router = useRouter();
  const { user, profile, loading, error: authError } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = (searchParams.get('q') || '').slice(0, 200);
  
  const [topic, setTopic] = React.useState(initialQuery);
  const [mode, setMode] = React.useState<'ai-driven' | 'research'>('ai-driven');
  const [visibility, setVisibility] = React.useState<'public' | 'private'>('public');
  const [isCreating, setIsCreating] = React.useState(false);
  const [step, setStep] = React.useState(0); 
  // 1: Agent 1 (Prompt Optimizer)
  // 2: Agent 2 (Curriculum Architect)
  // 3: Agent 3 (References Curator)
  // 4: Agent 4 (TOON Serializer)
  // 5: Finalizing & Saving
  const [error, setError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    const safeTopic = topic.trim();
    if (!safeTopic) {
      setError('Digite um tema para criar a trilha.');
      return;
    }

    if (!user || !profile) {
      setError('Você precisa estar logado para criar uma trilha.');
      return;
    }

    if (profile.credits <= 0) {
      setError('Você não tem créditos suficientes para gerar uma nova trilha.');
      return;
    }

    setIsCreating(true);
    setError(null);
    
    try {
      // ---------------------------------------------------------
      // Agente 1: Otimizador de Prompt (Refinamento de Escopo)
      // Só vale a pena para temas curtos/ambíguos: um tema já descritivo não
      // precisa de uma chamada de IA (economiza um request inteiro).
      // ---------------------------------------------------------
      setStep(1);
      let enhanced = safeTopic;
      const topicWords = safeTopic.split(/\s+/).filter(Boolean).length;

      if (topicWords < 3) {
        try {
          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 30000)
          );
          enhanced = await Promise.race([enhancePrompt(safeTopic), timeoutPromise]);
        } catch (e) {
          console.warn('Agente 1 indisponível; usando o tema original:', e);
          enhanced = safeTopic;
        }

        // The enhancer must not replace the user's subject with a generic dev
        // career. Also keep it under the API's enhancedPrompt limit.
        const lowerEnhanced = enhanced.toLowerCase();
        if (
          (lowerEnhanced.includes('full stack') ||
            lowerEnhanced.includes('desenvolvedor web')) &&
          !safeTopic.toLowerCase().includes('full stack') &&
          !safeTopic.toLowerCase().includes('web')
        ) {
          enhanced = safeTopic;
        }
        enhanced = enhanced.trim().slice(0, 2000) || safeTopic;
      }

      // ---------------------------------------------------------
      // Agente 2: Currículo completo
      // v2: uma chamada (40 tópicos em TOON tabular).
      // legado: list-topics → curate-references → structure-roadmap.
      // ---------------------------------------------------------
      let topicTree: Awaited<ReturnType<typeof generateCurriculum>>;

      if (CURRICULUM_V2) {
        setStep(2);
        topicTree = await generateCurriculum(safeTopic, enhanced);
      } else {
        setStep(2);
        const topicListText = await listTopics(safeTopic, enhanced);

        setStep(3);
        let referencesText = '';
        try {
          referencesText = await curateReferences(safeTopic, topicListText);
        } catch (refErr) {
          console.warn('Agente 3 indisponível; seguindo com referências genéricas:', refErr);
          referencesText = 'Documentações técnicas oficiais e literatura canônica recomendada.';
        }

        setStep(4);
        topicTree = await structureRoadmap(
          safeTopic,
          topicListText.slice(0, 20000),
          referencesText.slice(0, 8000)
        );
      }

      if (!topicTree || !topicTree.levels) {
        throw new Error(
          'A IA não conseguiu estruturar os tópicos corretamente. Tente um assunto mais específico.'
        );
      }

      // Enforce fidelity to the user's topic on the title
      let finalTitle = topicTree.roadmapTitle || safeTopic;
      const lowerTopic = safeTopic.toLowerCase();
      const lowerTitle = finalTitle.toLowerCase();
      if (
        (lowerTitle.includes('full stack') || lowerTitle.includes('desenvolvedor web')) &&
        !lowerTopic.includes('full stack') &&
        !lowerTopic.includes('web')
      ) {
        finalTitle = safeTopic;
      }
      finalTitle = finalTitle.trim().slice(0, 200) || safeTopic;

      // ---------------------------------------------------------
      // Finalização: Criação atômica no Firestore
      // ---------------------------------------------------------
      setStep(5);
      const levelMap: Record<string, number> = {
        PREREQUISITES: 0,
        BEGINNER: 1,
        INTERMEDIATE: 2,
        ADVANCED: 3,
        NEXT_STEPS: 4,
      };

      const allTopics: {
        title: string;
        description: string;
        searchTerms: string[];
        level: number;
        order: number;
      }[] = [];

      Object.entries(topicTree.levels).forEach(([levelKey, levelTopics]) => {
        const normalizedKey = levelKey.toUpperCase();
        if (Array.isArray(levelTopics)) {
          levelTopics.forEach((t: any) => {
            const title = typeof t?.title === 'string' ? t.title.trim() : '';
            if (!title) return;

            allTopics.push({
              title,
              description: t.description || '',
              searchTerms: Array.isArray(t.searchTerms) ? t.searchTerms : [],
              level: levelMap[normalizedKey] ?? 1,
              order: typeof t.order === 'number' ? t.order : allTopics.length + 1,
            });
          });
        }
      });

      if (allTopics.length === 0) {
        throw new Error('Nenhum tópico foi gerado para esta trilha. Tente novamente.');
      }

      // Curadoria do primeiro tópico: no v2 é lazy (gerada ao abrir o tópico),
      // o que evita uma chamada de ~2.500 tokens que o usuário pode nunca ler.
      let firstTopicContent: string | null = null;
      let firstTopicSources: Source[] = [];
      const roadmapContext = {
        title: finalTitle,
        originalTopic: safeTopic,
      };

      if (!CURRICULUM_V2) {
        try {
          const curated = await curateContent(allTopics[0].title, mode, roadmapContext);
          firstTopicContent = curated.content || null;
          firstTopicSources = curated.sources || [];
        } catch (curateErr) {
          console.warn('Pré-curadoria do tópico inicial diferida para sob demanda:', curateErr);
        }
      }

      const roadmapRef = doc(collection(db, 'roadmaps'));
      const topicsCollection = collection(db, `roadmaps/${roadmapRef.id}/topics`);
      const topicRefs = allTopics.map(() => doc(topicsCollection));
      const userRef = doc(db, 'users', user.uid);

      // Roadmap + topics + credit deduction in a single transaction:
      // no orphan roadmaps, no free roadmaps and no double-spend when the user
      // has two tabs open.
      await runTransaction(db, async (transaction) => {
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists()) {
          throw new Error('Seu perfil não foi encontrado. Saia e entre novamente.');
        }

        const currentCredits = Number(userSnapshot.data().credits ?? 0);
        if (!Number.isFinite(currentCredits) || currentCredits <= 0) {
          throw new Error('Você não tem créditos suficientes para criar outra trilha.');
        }

        transaction.set(roadmapRef, {
          title: finalTitle,
          originalTopic: safeTopic,
          enhancedPrompt: enhanced,
          mode,
          visibility,
          authorId: user.uid,
          authorName: profile.name,
          likes: 0,
          createdAt: serverTimestamp(),
        });

        allTopics.forEach((t, idx) => {
          const isFirst = idx === 0 && firstTopicContent !== null;
          transaction.set(topicRefs[idx], {
            roadmapId: roadmapRef.id,
            title: t.title,
            description: t.description,
            searchTerms: t.searchTerms,
            level: t.level,
            order: t.order,
            content: isFirst ? firstTopicContent : null,
            sources:
              isFirst && firstTopicSources.length > 0
                ? firstTopicSources
                : getOptimizedTopicSources(t.title, t.description, roadmapContext),
            createdAt: serverTimestamp(),
          });
        });

        transaction.update(userRef, { credits: currentCredits - 1 });
      });

      router.push(`/roadmap/${roadmapRef.id}`);
    } catch (err: any) {
      console.error('Generation Error:', err);
      const isFirestoreError =
        typeof err?.code === 'string' &&
        /permission|unavailable|offline|deadline|aborted|not-found|failed-precondition/i.test(
          err.code
        );
      setError(
        isFirestoreError
          ? handleFirestoreError(err, OperationType.WRITE, 'roadmaps').message
          : err?.message || 'Ocorreu um erro ao gerar sua trilha. Por favor, tente novamente.'
      );
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Carregando perfil" />
      </div>
    );
  }

  if (user && !profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center text-error mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold font-display">Não foi possível carregar seu perfil</h2>
        <p className="text-base-content/60 max-w-md mx-auto">
          {authError || 'Verifique sua conexão e tente novamente.'}
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Recarregar página
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-8">
        <div className="w-20 h-20 bg-base-300 rounded-3xl flex items-center justify-center text-base-content/30 mx-auto">
          <LogIn className="w-10 h-10" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight font-display">Acesso Restrito</h2>
          <p className="text-base-content/60 max-w-md mx-auto">
            Você precisa estar logado para criar trilhas personalizadas e acompanhar seu progresso.
          </p>
        </div>
        <button 
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="btn btn-primary btn-lg px-8 font-bold gap-2 shadow-xl shadow-primary/20"
        >
          Entrar com Google
        </button>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-12">
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary animate-pulse">
            <Sparkles className="w-12 h-12" />
          </div>
          <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl -z-10 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight font-display">Construindo sua Trilha</h2>
          <p className="text-base-content/60 max-w-md mx-auto text-sm">
            {CURRICULUM_V2
              ? 'Um agente de IA está montando sua grade curricular em uma única passada.'
              : 'Quatro agentes de IA especializados estão colaborando em sequência para arquitetar sua jornada de estudos.'}
          </p>
        </div>

        <div className="space-y-4 max-w-md mx-auto text-left bg-base-200/50 p-6 rounded-2xl border border-base-300">
          {(CURRICULUM_V2
            ? [
                { id: 1, label: 'Agente 1: Otimizando Prompt e Escopo Técnico' },
                { id: 2, label: 'Agente 2: Gerando Grade Curricular (40 tópicos)' },
                { id: 5, label: 'Finalizando: Gravando Trilha' },
              ]
            : [
                { id: 1, label: 'Agente 1: Otimizando Prompt e Escopo Técnico' },
                { id: 2, label: 'Agente 2: Estruturando Grade Curricular de Tópicos' },
                { id: 3, label: 'Agente 3: Mapeando Fontes e Referências Canônicas' },
                { id: 4, label: 'Agente 4: Serializando Dados em JSON' },
                { id: 5, label: 'Finalizando: Gravando Trilha e Curadoria Inicial' },
              ]
          ).map((loadingStep) => (
            <LoadingStep
              key={loadingStep.id}
              completed={step > loadingStep.id}
              active={step === loadingStep.id}
              label={loadingStep.label}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="card bg-base-100 border border-base-300 p-8 md:p-12 shadow-xl shadow-primary/5 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight font-display">Criar Nova Trilha</h1>
          <p className="text-base-content/60">Configure como você deseja que sua jornada de aprendizado seja gerada por nossos agentes de IA.</p>
        </div>

        {error && (
          <div className="alert alert-error shadow-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="space-y-8">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-xs font-bold uppercase tracking-wider">Assunto</span>
            </label>
            <input 
              type="text" 
              placeholder="ex: Banco de dados, React 19, Kubernetes, Rust..." 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={200}
              className="input input-bordered input-lg w-full font-medium focus:input-primary"
            />
          </div>

          <div className="space-y-4">
            <label className="label p-0">
              <span className="label-text text-xs font-bold uppercase tracking-wider">Modo de Aprendizado</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setMode('ai-driven')}
                aria-pressed={mode === 'ai-driven'}
                className={cn(
                  "p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 text-left",
                  mode === 'ai-driven' ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-base-300 hover:border-base-content/20"
                )}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-bold">IA-Driven</span>
                  {mode === 'ai-driven' && <div className="badge badge-primary badge-sm font-bold">Ativo</div>}
                </div>
                <p className="text-xs text-base-content/60">Conteúdo autoral gerado com alta densidade, desafios práticos e quiz interativo.</p>
              </button>

              <button 
                type="button"
                onClick={() => setMode('research')}
                aria-pressed={mode === 'research'}
                className={cn(
                  "p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-3 text-left",
                  mode === 'research' ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-base-300 hover:border-base-content/20"
                )}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="font-bold">Research Mode</span>
                  {mode === 'research' && <div className="badge badge-primary badge-sm font-bold">Ativo</div>}
                </div>
                <p className="text-xs text-base-content/60">Foco em curadoria de links oficiais, livros de referência e documentações consagradas.</p>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="label p-0">
              <span className="label-text text-xs font-bold uppercase tracking-wider">Visibilidade</span>
            </label>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setVisibility('public')}
                className={cn(
                  "btn flex-1 font-bold",
                  visibility === 'public' ? "btn-primary" : "btn-outline border-base-300"
                )}
              >
                Pública
              </button>
              <button 
                type="button"
                onClick={() => setVisibility('private')}
                className={cn(
                  "btn flex-1 font-bold",
                  visibility === 'private' ? "btn-primary" : "btn-outline border-base-300"
                )}
              >
                Privada
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleCreate}
          disabled={!topic.trim() || isCreating}
          className="btn btn-primary btn-lg w-full font-bold text-lg shadow-xl shadow-primary/20"
        >
          Gerar Minha Trilha (1 Crédito)
        </button>
      </div>
    </div>
  );
}

function LoadingStep({ completed, active, label }: { completed: boolean; active: boolean; label: string }) {
  return (
    <div className={cn("flex items-center gap-3 transition-all duration-300", active || completed ? "opacity-100" : "opacity-35")}>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors", 
        completed ? "bg-success text-success-content" : active ? "bg-primary text-primary-content animate-pulse" : "bg-base-300 text-base-content/40"
      )}>
        {completed ? (
          <CheckCircle2 className="w-3.5 h-3.5" />
        ) : active ? (
          <Sparkles className="w-3 h-3" />
        ) : (
          <div className="w-1.5 h-1.5 bg-base-content/40 rounded-full" />
        )}
      </div>
      <span className={cn("text-xs md:text-sm font-semibold", completed ? "text-base-content font-medium" : active ? "text-primary font-bold" : "text-base-content/50")}>
        {label}
      </span>
      {active && !completed && <span className="loading loading-spinner loading-xs text-primary ml-auto"></span>}
    </div>
  );
}

export default function CreateRoadmapPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-40">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    }>
      <CreateRoadmapContent />
    </Suspense>
  );
}
