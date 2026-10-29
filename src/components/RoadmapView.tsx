'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Topic, Roadmap, ProgressStatus, Challenge } from '../types';
import { GripVertical, Layers, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Book, Video, Link as LinkIcon, FileText, Trophy, HelpCircle, Sparkles, AlertCircle, Edit3, Save, X, Trash2, Plus, Eye, ExternalLink, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { generateChallenge, generateTopicContentAndSources, curateContent } from '../services/geminiService';
import { db, updateDoc, doc, handleFirestoreError, OperationType, FirebaseUser, collection, addDoc, deleteDoc, writeBatch } from '../lib/firebase';
import { deleteRoadmap } from '../lib/roadmapService';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface RoadmapViewProps {
  roadmap: Roadmap;
  topics: Topic[];
  progress: Record<string, ProgressStatus>;
  onUpdateProgress: (topicId: string, status: ProgressStatus) => void;
  user: FirebaseUser | null;
}

const LEVELS = [
  "Fundamentos & Pré-requisitos",
  "Iniciante",
  "Intermediário",
  "Avançado",
  "Próximos Passos"
];

const LEVEL_COLORS = [
  "bg-level-0",
  "bg-level-1",
  "bg-level-2",
  "bg-level-3",
  "bg-level-4"
];

const LEVEL_BORDER_COLORS = [
  "border-level-0",
  "border-level-1",
  "border-level-2",
  "border-level-3",
  "border-level-4"
];

const LEVEL_TEXT_COLORS = [
  "text-level-0",
  "text-level-1",
  "text-level-2",
  "text-level-3",
  "text-level-4"
];

export default function RoadmapView({ roadmap, topics, progress, onUpdateProgress, user }: RoadmapViewProps) {
  const [expandedTopics, setExpandedTopics] = React.useState<Record<string, boolean>>({});
  const [isGeneratingChallenge, setIsGeneratingChallenge] = React.useState<Record<string, boolean>>({});
  const [challengeError, setChallengeError] = React.useState<Record<string, string>>({});
  const [isGeneratingContent, setIsGeneratingContent] = React.useState<Record<string, boolean>>({});
  const [contentError, setContentError] = React.useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [addingTopicToLevel, setAddingTopicToLevel] = React.useState<number | null>(null);
  const [newTopicData, setNewTopicData] = React.useState({ title: '', content: '', description: '' });
  const [isAddingTopic, setIsAddingTopic] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const router = useRouter();
  const isAuthor = user?.uid === roadmap.authorId;

  const handleDeleteRoadmap = async () => {
    if (!user || !isAuthor) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoadmap(roadmap.id, user.uid, roadmap.authorId);
      router.push('/discover');
    } catch (err: any) {
      console.error('Erro ao excluir roadmap:', err);
      setDeleteError(err?.message || 'Falha ao excluir a trilha. Tente novamente.');
      setIsDeleting(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleUpdateTopic = async (topicId: string, updates: Partial<Topic>) => {
    try {
      const topicRef = doc(db, `roadmaps/${roadmap.id}/topics`, topicId);
      await updateDoc(topicRef, updates);
    } catch (error) {
      console.error("Error updating topic:", error);
      handleFirestoreError(error, OperationType.UPDATE, `roadmaps/${roadmap.id}/topics/${topicId}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, level: number) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const levelTopics = [...(topicsByLevel[level] || [])];
      const oldIndex = levelTopics.findIndex((t) => t.id === active.id);
      const newIndex = levelTopics.findIndex((t) => t.id === over.id);

      const newOrderedTopics = arrayMove(levelTopics, oldIndex, newIndex);
      
      try {
        const batch = writeBatch(db);
        newOrderedTopics.forEach((topic, index) => {
          const topicRef = doc(db, `roadmaps/${roadmap.id}/topics`, topic.id);
          batch.update(topicRef, { order: index + 1 });
        });
        await batch.commit();
      } catch (error) {
        console.error("Error reordering topics:", error);
        handleFirestoreError(error, OperationType.UPDATE, `roadmaps/${roadmap.id}/topics`);
      }
    }
  };

  const handleCreateTopic = async (level: number) => {
    if (!newTopicData.title) return;
    if (!newTopicData.content && !newTopicData.description) return;

    setIsAddingTopic(true);
    try {
      const shouldGenerateContent = !newTopicData.content;
      const { content, sources } = await generateTopicContentAndSources(
        newTopicData.title,
        newTopicData.description,
        { title: roadmap.title, originalTopic: roadmap.originalTopic },
        shouldGenerateContent
      );

      const levelTopics = topicsByLevel[level] || [];
      const nextOrder = levelTopics.length > 0 ? Math.max(...levelTopics.map(t => t.order)) + 1 : 1;

      const topicData = {
        roadmapId: roadmap.id,
        title: newTopicData.title,
        content: shouldGenerateContent ? content : newTopicData.content,
        level,
        order: nextOrder,
        sources,
        createdAt: new Date()
      };

      await addDoc(collection(db, `roadmaps/${roadmap.id}/topics`), topicData);
      
      setAddingTopicToLevel(null);
      setNewTopicData({ title: '', content: '', description: '' });
    } catch (error) {
      console.error("Error creating topic:", error);
      handleFirestoreError(error, OperationType.WRITE, `roadmaps/${roadmap.id}/topics`);
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const topicRef = doc(db, `roadmaps/${roadmap.id}/topics`, topicId);
      await deleteDoc(topicRef);
    } catch (error) {
      console.error("Error deleting topic:", error);
      handleFirestoreError(error, OperationType.DELETE, `roadmaps/${roadmap.id}/topics/${topicId}`);
    }
  };

  const handleGenerateChallenge = async (topic: Topic) => {
    if (isGeneratingChallenge[topic.id]) return;
    
    setIsGeneratingChallenge(prev => ({ ...(prev || {}), [topic.id]: true }));
    setChallengeError(prev => ({ ...(prev || {}), [topic.id]: '' }));

    try {
      const challenge = await generateChallenge(topic.title, topic.content || '');
      const topicRef = doc(db, `roadmaps/${roadmap.id}/topics`, topic.id);
      await updateDoc(topicRef, { challenge });
    } catch (error) {
      console.error("Error generating challenge:", error);
      setChallengeError(prev => ({ ...(prev || {}), [topic.id]: "Falha ao gerar o desafio. Tente novamente." }));
      handleFirestoreError(error, OperationType.UPDATE, `roadmaps/${roadmap.id}/topics/${topic.id}`);
    } finally {
      setIsGeneratingChallenge(prev => ({ ...(prev || {}), [topic.id]: false }));
    }
  };

  const handleGenerateContent = async (topic: Topic) => {
    if (isGeneratingContent[topic.id]) return;

    setIsGeneratingContent(prev => ({ ...(prev || {}), [topic.id]: true }));
    setContentError(prev => ({ ...(prev || {}), [topic.id]: '' }));

    try {
      const res = await curateContent(topic.title, roadmap.mode, {
        title: roadmap.title,
        originalTopic: roadmap.originalTopic,
      });
      if (!res.content) {
        throw new Error('A IA não gerou conteúdo para este tópico.');
      }
      const topicRef = doc(db, `roadmaps/${roadmap.id}/topics`, topic.id);
      const updatedSources = res.sources && res.sources.length > 0 ? res.sources : (topic.sources || []);
      await updateDoc(topicRef, {
        content: res.content,
        sources: updatedSources,
      });
    } catch (error: any) {
      console.error('Error generating content:', error);
      setContentError(prev => ({
        ...(prev || {}),
        [topic.id]: error?.message || 'Falha ao gerar conteúdo explicativo. Tente novamente em instantes.'
      }));
    } finally {
      setIsGeneratingContent(prev => ({ ...(prev || {}), [topic.id]: false }));
    }
  };

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const topicsByLevel = React.useMemo(() => {
    const grouped: Record<number, Topic[]> = {};
    topics.forEach(topic => {
      if (!grouped[topic.level]) grouped[topic.level] = [];
      grouped[topic.level].push(topic);
    });
    // Sort by order
    Object.keys(grouped).forEach(level => {
      grouped[Number(level)].sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [topics]);

  const totalTopics = topics.length;
  const completedTopics = Object.values(progress).filter(s => s === 'completed').length;
  const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Top Progress Bar */}
      <div className="sticky top-16 z-40 bg-base-100/80 backdrop-blur-md border-b border-base-300 -mx-4 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex-1">
          <progress className="progress progress-primary w-full h-3" value={progressPercentage} max="100"></progress>
        </div>
        <span className="text-xs font-bold whitespace-nowrap">{progressPercentage}% Concluído</span>
      </div>

      <div className="text-center mb-16">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div className="badge badge-primary badge-outline gap-2 font-bold uppercase tracking-wider py-3 px-4">
            <Layers className="w-3 h-3" />
            <span>{roadmap.mode === 'ai-driven' ? 'AI Driven' : 'Research Mode'}</span>
          </div>
          {isAuthor && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={cn(
                  "btn btn-sm gap-2 rounded-full",
                  isEditMode ? "btn-secondary" : "btn-ghost border-base-300"
                )}
              >
                {isEditMode ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                {isEditMode ? "Sair da Edição" : "Editar Trilha"}
              </button>
              {isEditMode && (
                <button 
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="btn btn-sm btn-ghost hover:btn-error text-error gap-2 rounded-full border border-error/20"
                  title="Excluir Trilha Permanentemente"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight font-display">{roadmap.title}</h1>
        <p className="text-lg text-base-content/60 max-w-2xl mx-auto">
          Trilha completa de estudos para dominar {roadmap.originalTopic}.
        </p>
      </div>

      <div className="space-y-16 relative">
        {/* Vertical Line */}
        <div className="absolute left-4 md:left-8 top-0 bottom-0 w-0.5 bg-base-300 -z-10" />

        {LEVELS.map((levelName, levelIndex) => {
          const levelTopics = topicsByLevel[levelIndex] || [];
          if (levelTopics.length === 0) return null;

          return (
            <div key={levelIndex} className="space-y-6">
              <div className="flex items-center gap-4 sticky top-28 bg-base-200/80 backdrop-blur-sm py-2 z-10 rounded-r-xl">
                <div className={cn(
                  "w-8 h-8 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center text-white shadow-sm",
                  LEVEL_COLORS[levelIndex],
                  LEVEL_BORDER_COLORS[levelIndex]
                )}>
                  <span className="text-xl md:text-2xl font-black">{levelIndex}</span>
                </div>
                <h2 className={cn("text-xl md:text-2xl font-extrabold tracking-tight font-display", LEVEL_TEXT_COLORS[levelIndex])}>
                  {levelName}
                </h2>
              </div>

              <div className="space-y-4 pl-4 md:pl-20">
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleDragEnd(event, levelIndex)}
                >
                  <SortableContext 
                    items={levelTopics.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {levelTopics.map((topic) => (
                      <SortableTopicCard
                        key={topic.id}
                        topic={topic}
                        isExpanded={!!expandedTopics[topic.id]}
                        onToggle={() => toggleTopic(topic.id)}
                        status={progress[topic.id] || 'not-started'}
                        onUpdateStatus={(status) => onUpdateProgress(topic.id, status)}
                        levelColor={LEVEL_TEXT_COLORS[levelIndex]}
                        onGenerateChallenge={handleGenerateChallenge}
                        isGeneratingChallenge={!!(isGeneratingChallenge && isGeneratingChallenge[topic.id])}
                        challengeError={challengeError ? challengeError[topic.id] : undefined}
                        onGenerateContent={handleGenerateContent}
                        isGeneratingContent={!!(isGeneratingContent && isGeneratingContent[topic.id])}
                        contentError={contentError ? contentError[topic.id] : undefined}
                        isEditMode={isEditMode}
                        onUpdateTopic={(updates) => handleUpdateTopic(topic.id, updates)}
                        onDeleteTopic={() => handleDeleteTopic(topic.id)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {isEditMode && (
                  <div className="pt-4">
                    {addingTopicToLevel === levelIndex ? (
                      <div className="card bg-base-100 border-2 border-dashed border-primary/30 p-6 space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Novo Tópico</h4>
                        <div className="space-y-4">
                          <div className="form-control">
                            <label className="label py-1"><span className="label-text text-xs font-bold uppercase opacity-50">Título *</span></label>
                            <input 
                              type="text" 
                              className="input input-bordered w-full" 
                              placeholder="Ex: Introdução ao TypeScript"
                              value={newTopicData.title}
                              onChange={(e) => setNewTopicData({...newTopicData, title: e.target.value})}
                            />
                          </div>
                          
                          <div className="form-control">
                            <label className="label py-1">
                              <span className="label-text text-xs font-bold uppercase opacity-50">Conteúdo Explicativo (Opcional)</span>
                            </label>
                            <textarea 
                              className="textarea textarea-bordered min-h-[100px]" 
                              placeholder="Se deixar vazio, a IA gerará o conteúdo com base na descrição abaixo."
                              value={newTopicData.content}
                              onChange={(e) => setNewTopicData({...newTopicData, content: e.target.value})}
                            />
                          </div>

                          {!newTopicData.content && (
                            <div className="form-control">
                              <label className="label py-1">
                                <span className="label-text text-xs font-bold uppercase opacity-50 text-primary">Descrição para a IA *</span>
                              </label>
                              <textarea 
                                className="textarea textarea-bordered border-primary/30" 
                                placeholder="Descreva o que este tópico deve cobrir para que a IA gere o conteúdo e fontes corretamente."
                                value={newTopicData.description}
                                onChange={(e) => setNewTopicData({...newTopicData, description: e.target.value})}
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-2">
                            <button 
                              className="btn btn-ghost btn-sm" 
                              onClick={() => setAddingTopicToLevel(null)}
                              disabled={isAddingTopic}
                            >
                              Cancelar
                            </button>
                            <button 
                              className="btn btn-primary btn-sm gap-2" 
                              onClick={() => handleCreateTopic(levelIndex)}
                              disabled={isAddingTopic || !newTopicData.title || (!newTopicData.content && !newTopicData.description)}
                            >
                              {isAddingTopic ? (
                                <>
                                  <span className="loading loading-spinner loading-xs"></span>
                                  Criando...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Criar Tópico
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setAddingTopicToLevel(levelIndex)}
                        className="btn btn-ghost btn-block border-2 border-dashed border-base-300 hover:border-primary/30 hover:bg-primary/5 text-base-content/40 hover:text-primary gap-2 py-8 h-auto"
                      >
                        <Plus className="w-5 h-5" />
                        Adicionar Tópico em {levelName}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Roadmap Confirmation Modal */}
      <AnimatePresence>
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card bg-base-100 border border-base-300 max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-display text-base-content">
                    Excluir Trilha de Estudos?
                  </h3>
                  <p className="text-sm text-base-content/60">
                    Você está prestes a excluir permanentemente a trilha <strong className="text-base-content">&quot;{roadmap.title}&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-error/5 border border-error/20 text-xs text-base-content/80 space-y-1">
                <p className="font-semibold text-error">Esta ação é irreversível.</p>
                <p>Todos os tópicos, conteúdos detalhados, referências e dados de progresso associados serão removidos para sempre.</p>
              </div>

              {deleteError && (
                <div className="alert alert-error text-xs p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="btn btn-ghost btn-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteRoadmap}
                  disabled={isDeleting}
                  className="btn btn-error btn-sm font-bold gap-2 text-white shadow-lg shadow-error/20"
                >
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableTopicCard(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {props.isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-[-30px] top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing text-base-content/20 hover:text-primary transition-colors opacity-0 group-hover/sortable:opacity-100"
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <TopicCard {...props} />
    </div>
  );
}

function TopicCard({ 
  topic, 
  isExpanded, 
  onToggle, 
  status, 
  onUpdateStatus, 
  levelColor, 
  onGenerateChallenge, 
  isGeneratingChallenge, 
  challengeError,
  onGenerateContent,
  isGeneratingContent = false,
  contentError,
  isEditMode, 
  onUpdateTopic, 
  onDeleteTopic 
}: { 
  topic: Topic, 
  isExpanded: boolean, 
  onToggle: () => void,
  status: ProgressStatus,
  onUpdateStatus: (status: ProgressStatus) => void,
  levelColor: string,
  onGenerateChallenge: (topic: Topic) => void,
  isGeneratingChallenge: boolean,
  challengeError?: string,
  onGenerateContent: (topic: Topic) => void,
  isGeneratingContent?: boolean,
  contentError?: string,
  isEditMode: boolean,
  onUpdateTopic: (updates: Partial<Topic>) => Promise<void>,
  onDeleteTopic: () => Promise<void>
}) {
  const [localEditMode, setLocalEditMode] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(topic.title);
  const [editedContent, setEditedContent] = React.useState(topic.content || '');
  const [isSaving, setIsSaving] = React.useState(false);
  const [showAddSource, setShowAddSource] = React.useState(false);
  const [newSource, setNewSource] = React.useState<{
    type: 'book' | 'article' | 'video' | 'guide';
    title: string;
    url: string;
    author: string;
    description: string;
    searchQuery: string;
  }>({
    type: 'guide',
    title: '',
    url: '',
    author: '',
    description: '',
    searchQuery: '',
  });

  React.useEffect(() => {
    setEditedTitle(topic.title);
    setEditedContent(topic.content || '');
  }, [topic.title, topic.content]);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    await onUpdateTopic({ title: editedTitle, content: editedContent });
    setIsSaving(false);
    setLocalEditMode(false);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedTitle(topic.title);
    setEditedContent(topic.content || '');
    setLocalEditMode(false);
  };

  const handleAddSource = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sourceToAdd = { ...newSource, isManual: true };
    const currentSources = topic.sources || [];
    await onUpdateTopic({ sources: [...currentSources, sourceToAdd] });
    setNewSource({
      type: 'guide',
      title: '',
      url: '',
      author: '',
      description: '',
      searchQuery: '',
    });
    setShowAddSource(false);
  };

  const handleRemoveSource = async (index: number) => {
    const currentSources = [...(topic.sources || [])];
    currentSources.splice(index, 1);
    await onUpdateTopic({ sources: currentSources });
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'in-progress': return <Clock className="w-6 h-6 text-warning" />;
      default: return <Circle className="w-6 h-6 text-base-content/20" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in-progress': return 'Em andamento';
      default: return 'Não iniciado';
    }
  };

  return (
    <div className={cn(
      "card bg-base-100 border transition-all duration-300 overflow-hidden",
      isExpanded ? "border-primary/30 shadow-xl shadow-primary/5" : "border-base-300 shadow-sm hover:border-base-content/20"
    )}>
      <div className="p-4 md:p-6 flex items-center justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus: ProgressStatus = status === 'not-started' ? 'in-progress' : status === 'in-progress' ? 'completed' : 'not-started';
              onUpdateStatus(nextStatus);
            }}
            className="hover:scale-110 transition-transform"
          >
            {getStatusIcon()}
          </button>
          <div>
            {localEditMode ? (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="input input-bordered input-sm w-full font-bold"
                  placeholder="Título do tópico"
                />
              </div>
            ) : (
              <>
                <h3 className={cn("text-lg font-bold font-display", status === 'completed' && "text-base-content/40 line-through")}>
                  {topic.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-base-200", levelColor)}>Nível {topic.level}</span>
                  <span className="text-[10px] font-medium text-base-content/40 uppercase tracking-wider">• {getStatusText()}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && !localEditMode && (
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalEditMode(true);
                  if (!isExpanded) onToggle();
                }}
                className="btn btn-ghost btn-xs btn-circle text-primary"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="btn btn-ghost btn-xs btn-circle text-error"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          {localEditMode && (
            <div className="flex items-center gap-1">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-success btn-xs btn-circle"
              >
                {isSaving ? <span className="loading loading-spinner loading-xs"></span> : <Save className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleCancel}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="text-base-content/30">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-8 pt-2 border-t border-base-300 space-y-8">
              {localEditMode ? (
                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-xs uppercase tracking-wider text-base-content/50">Conteúdo (Markdown)</span>
                    </label>
                    <textarea 
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="textarea textarea-bordered min-h-[300px] font-mono text-sm leading-relaxed"
                      placeholder="Escreva o conteúdo explicativo aqui..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {topic.description && (
                    <div className="bg-base-200/40 border border-base-300 rounded-xl p-4 text-sm text-base-content/80 leading-relaxed">
                      <span className="font-bold text-xs uppercase tracking-wider block text-base-content/50 mb-1">Visão Geral</span>
                      {topic.description}
                    </div>
                  )}

                  {topic.content && topic.content !== "Conteúdo não disponível no momento." ? (
                    <div className="space-y-4">
                      <div className="prose max-w-none prose-headings:text-base-content prose-p:text-base-content/80 prose-strong:text-base-content prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                        <ReactMarkdown>{topic.content}</ReactMarkdown>
                      </div>
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onGenerateContent(topic);
                          }}
                          disabled={isGeneratingContent}
                          className="btn btn-ghost btn-xs text-base-content/50 hover:text-primary gap-1"
                          title="Regenerar aula completa com IA"
                        >
                          {isGeneratingContent ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Atualizando com IA...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Regenerar com IA
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="card bg-base-200/60 border border-base-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1 text-center sm:text-left">
                        <h5 className="font-bold text-sm flex items-center justify-center sm:justify-start gap-2 text-base-content">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" />
                          Explicação Detalhada Disponível
                        </h5>
                        <p className="text-xs text-base-content/60 max-w-md">
                          Gere uma explicação aprofundada com conceitos fundamentais, guia prático e exemplos usando IA sob demanda.
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateContent(topic);
                        }}
                        disabled={isGeneratingContent}
                        className="btn btn-primary btn-sm gap-2 shrink-0 shadow-md shadow-primary/20"
                      >
                        {isGeneratingContent ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Gerando Aula...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Gerar Conteúdo com IA
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {contentError && (
                    <div className="alert alert-warning text-xs py-2 px-3 shadow-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{contentError}</span>
                    </div>
                  )}
                </div>
              )}

              {topic.sources && topic.sources.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Fontes e Referências
                    </h4>
                    {isEditMode && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddSource(true);
                        }}
                        className="btn btn-ghost btn-xs gap-1 text-primary"
                      >
                        <Plus className="w-3 h-3" />
                        Adicionar Fonte
                      </button>
                    )}
                  </div>

                  {showAddSource && (
                    <div className="bg-base-200 p-4 rounded-xl space-y-4 border border-primary/20" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control w-full">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Tipo de Recurso</span></label>
                          <select 
                            className="select select-bordered select-sm w-full"
                            value={newSource.type}
                            onChange={(e) => setNewSource({...newSource, type: e.target.value as any})}
                          >
                            <option value="guide">Documentação Oficial / Guia</option>
                            <option value="article">Artigo Técnico</option>
                            <option value="video">Vídeo / Aula</option>
                            <option value="book">Livro / Referência</option>
                          </select>
                        </div>
                        <div className="form-control w-full">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Título da Fonte</span></label>
                          <input 
                            type="text" 
                            className="input input-bordered input-sm w-full" 
                            placeholder="Ex: Documentação Oficial do React"
                            value={newSource.title}
                            onChange={(e) => setNewSource({...newSource, title: e.target.value})}
                          />
                        </div>
                        <div className="form-control w-full">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">URL Direta (Não use links de busca)</span></label>
                          <input 
                            type="url" 
                            className="input input-bordered input-sm w-full" 
                            placeholder="https://react.dev/learn"
                            value={newSource.url}
                            onChange={(e) => setNewSource({...newSource, url: e.target.value})}
                          />
                        </div>
                        <div className="form-control w-full">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Autor / Plataforma</span></label>
                          <input 
                            type="text" 
                            className="input input-bordered input-sm w-full" 
                            placeholder="Ex: React Docs, MDN, Rocketseat"
                            value={newSource.author}
                            onChange={(e) => setNewSource({...newSource, author: e.target.value})}
                          />
                        </div>
                        <div className="form-control w-full md:col-span-2">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Resumo do Conteúdo / O que focar</span></label>
                          <input 
                            type="text" 
                            className="input input-bordered input-sm w-full" 
                            placeholder="Breve descrição do que este material ensina..."
                            value={newSource.description}
                            onChange={(e) => setNewSource({...newSource, description: e.target.value})}
                          />
                        </div>
                        <div className="form-control w-full md:col-span-2">
                          <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-50">Termos Recomendados para Pesquisa</span></label>
                          <input 
                            type="text" 
                            className="input input-bordered input-sm w-full" 
                            placeholder="Ex: tutorial componentes react hooks estado 2024 pt-br"
                            value={newSource.searchQuery}
                            onChange={(e) => setNewSource({...newSource, searchQuery: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost btn-xs" onClick={() => setShowAddSource(false)}>Cancelar</button>
                        <button 
                          className="btn btn-primary btn-xs" 
                          onClick={handleAddSource}
                          disabled={!newSource.title || !newSource.url}
                        >
                          Salvar Fonte
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topic.sources.map((source, idx) => (
                      <div key={idx} className="relative group flex flex-col justify-between p-4 rounded-xl border border-base-300 bg-base-100 hover:border-primary/50 hover:shadow-sm transition-all">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="badge badge-sm font-semibold gap-1.5 uppercase text-[10px] tracking-wider py-2">
                              {source.type === 'book' && <Book className="w-3.5 h-3.5 text-secondary" />}
                              {source.type === 'video' && <Video className="w-3.5 h-3.5 text-error" />}
                              {source.type === 'article' && <FileText className="w-3.5 h-3.5 text-info" />}
                              {source.type === 'guide' && <LinkIcon className="w-3.5 h-3.5 text-primary" />}
                              {source.type === 'guide' ? 'Documentação' : source.type === 'video' ? 'Vídeo / Aula' : source.type === 'article' ? 'Artigo Técnico' : 'Livro / Manual'}
                            </span>
                            {source.publisher && (
                              <span className="text-[11px] text-base-content/60 font-medium truncate max-w-[140px]">{source.publisher}</span>
                            )}
                          </div>

                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group/link block"
                          >
                            <h5 className="text-sm font-bold leading-snug group-hover/link:text-primary transition-colors line-clamp-2">
                              {source.title}
                            </h5>
                          </a>

                          {source.author && source.author !== source.publisher && (
                            <p className="text-xs text-base-content/60 font-medium">Por: {source.author}</p>
                          )}

                          {source.description && (
                            <p className="text-xs text-base-content/75 line-clamp-3 leading-relaxed">
                              {source.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-base-200/80 space-y-2.5">
                          {source.searchQuery && (
                            <div className="bg-base-200/60 rounded-lg p-2 text-[11px] text-base-content/70 flex items-start gap-1.5">
                              <Search className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="font-semibold text-base-content/90">Dica de pesquisa:</span>{" "}
                                <span className="italic font-mono text-[10px] text-base-content/80 select-all">&ldquo;{source.searchQuery}&rdquo;</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-xs btn-outline btn-primary gap-1 group/btn"
                            >
                              <span>Acessar Material</span>
                              <ExternalLink className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                            </a>
                            {source.isManual && (
                              <span className="badge badge-ghost badge-xs opacity-60">Manual</span>
                            )}
                          </div>
                        </div>

                        {isEditMode && (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemoveSource(idx);
                            }}
                            className="absolute top-2 right-2 btn btn-ghost btn-xs btn-circle text-error opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover fonte"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenge Section */}
              <div className="pt-6 border-t border-base-300">
                {!topic.challenge ? (
                  <div className="bg-base-200 rounded-2xl p-6 text-center space-y-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold">Desafio do Tópico</h4>
                      <p className="text-xs text-base-content/60">Teste seus conhecimentos com um quiz e uma atividade prática.</p>
                    </div>
                    {challengeError && (
                      <div className="flex items-center gap-2 text-error text-xs justify-center">
                        <AlertCircle className="w-3 h-3" />
                        <span>{challengeError}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => onGenerateChallenge(topic)}
                      disabled={isGeneratingChallenge}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      {isGeneratingChallenge ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Gerar Desafio
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <ChallengeDisplay challenge={topic.challenge} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-base-100 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-base-300">
            <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center text-error mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold">Excluir Tópico?</h3>
              <p className="text-sm text-base-content/60">
                Tem certeza que deseja excluir o tópico <strong>&quot;{topic.title}&quot;</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                className="btn btn-error btn-sm w-full" 
                onClick={async () => {
                  await onDeleteTopic();
                  setShowDeleteConfirm(false);
                }}
              >
                Sim, Excluir Tópico
              </button>
              <button className="btn btn-ghost btn-sm w-full" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChallengeDisplay({ challenge }: { challenge: Challenge }) {
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [showExplanations, setShowExplanations] = React.useState<Record<number, boolean>>({});
  const [showSolution, setShowSolution] = React.useState(false);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" />
          Quiz de Conhecimento
        </h4>
        <div className="space-y-6">
          {challenge.questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-3">
              <p className="text-sm font-medium">{qIdx + 1}. {q.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[qIdx] === oIdx;
                  const isCorrect = oIdx === q.correctAnswer;
                  const showResult = showExplanations[qIdx];

                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        if (showExplanations[qIdx]) return;
                        setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
                        setShowExplanations(prev => ({ ...prev, [qIdx]: true }));
                      }}
                      className={cn(
                        "text-left p-3 rounded-xl border text-sm transition-all",
                        !showResult && "hover:border-primary hover:bg-primary/5 border-base-300",
                        showResult && isCorrect && "bg-success/10 border-success text-success-content",
                        showResult && isSelected && !isCorrect && "bg-error/10 border-error text-error-content",
                        showResult && !isSelected && !isCorrect && "opacity-50 border-base-300"
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showExplanations[qIdx] && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-base-200 rounded-xl text-xs leading-relaxed"
                >
                  <span className="font-bold">Explicação:</span> {q.explanation}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-secondary" />
          Atividade Prática
        </h4>
        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-6 space-y-4">
          <div>
            <h5 className="font-bold text-secondary">{challenge.activity.title}</h5>
            <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
              {challenge.activity.description}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60">Requisitos</p>
            <ul className="space-y-1">
              {challenge.activity.requirements.map((req, idx) => (
                <li key={idx} className="text-xs flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {challenge.activity.solution && (
            <div className="pt-4 border-t border-secondary/10">
              {showSolution ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondary/60">Solução Sugerida</p>
                  <div className="prose prose-sm max-w-none prose-p:text-xs prose-code:text-secondary prose-code:bg-secondary/10 prose-pre:bg-base-300">
                    <ReactMarkdown>{challenge.activity.solution}</ReactMarkdown>
                  </div>
                  <button 
                    onClick={() => setShowSolution(false)}
                    className="btn btn-ghost btn-xs text-secondary"
                  >
                    Ocultar Solução
                  </button>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setShowSolution(true)}
                  className="btn btn-secondary btn-sm btn-outline gap-2 w-full md:w-auto"
                >
                  <Eye className="w-4 h-4" />
                  Ver Solução
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
