/**
 * TOON (Token-Oriented Object Notation) / Compact Notation Parser
 * Converts ultra-compact arrays or key-abbreviated JSON into standardized application types.
 */

import { RoadmapDecomposition } from "@/src/types";

export interface CompactTopic {
  t: string;
  d: string;
  o?: number;
  s?: string[];
}

export interface CompactLevels {
  PREREQUISITES: CompactTopic[];
  BEGINNER: CompactTopic[];
  INTERMEDIATE: CompactTopic[];
  ADVANCED: CompactTopic[];
  NEXT_STEPS: CompactTopic[];
}

export interface CompactRoadmap {
  rt: string; // roadmapTitle
  lv: CompactLevels;
}

/**
 * Normalizes either TOON compact format or standard JSON into the standard RoadmapDecomposition.
 * Resilient against lowercase keys, nested objects, strings in place of objects, etc.
 */
export function parseCompactRoadmap(data: any): RoadmapDecomposition {
  if (!data) {
    throw new Error("Dados de roadmap vazios.");
  }

  const roadmapTitle = data.roadmapTitle || data.rt || data.title || "Trilha de Aprendizagem";
  const levelsSource = data.levels || data.lv || data;

  const levelAliases: Record<string, string[]> = {
    PREREQUISITES: ["PREREQUISITES", "prerequisites", "prerequisitos", "pré-requisitos", "fundamentos", "basics", "fundamentals", "level0", "0"],
    BEGINNER: ["BEGINNER", "beginner", "iniciante", "iniciantes", "basic", "level1", "1"],
    INTERMEDIATE: ["INTERMEDIATE", "intermediate", "intermediario", "intermediário", "intermediarios", "core", "level2", "2"],
    ADVANCED: ["ADVANCED", "advanced", "avancado", "avançado", "avancados", "expert", "level3", "3"],
    NEXT_STEPS: ["NEXT_STEPS", "next_steps", "nextsteps", "proximos_passos", "próximos passos", "proximosPassos", "next", "future", "level4", "4"],
  };

  const normalizedLevels: any = {
    PREREQUISITES: [],
    BEGINNER: [],
    INTERMEDIATE: [],
    ADVANCED: [],
    NEXT_STEPS: [],
  };

  Object.entries(levelAliases).forEach(([standardKey, aliases]) => {
    let rawList: any = null;
    if (typeof levelsSource === "object" && levelsSource !== null) {
      for (const alias of aliases) {
        if (levelsSource[alias] !== undefined) {
          rawList = levelsSource[alias];
          break;
        }
      }

      if (!rawList) {
        const foundKey = Object.keys(levelsSource).find((k) =>
          aliases.includes(k.toLowerCase().replace(/[^a-z0-9]/g, ""))
        );
        if (foundKey) {
          rawList = levelsSource[foundKey];
        }
      }
    }

    // If rawList is an object like { topics: [...] } or { items: [...] }
    if (rawList && !Array.isArray(rawList) && typeof rawList === "object") {
      if (Array.isArray(rawList.topics)) rawList = rawList.topics;
      else if (Array.isArray(rawList.items)) rawList = rawList.items;
      else if (Array.isArray(rawList.list)) rawList = rawList.list;
    }

    const arrayToMap = Array.isArray(rawList) ? rawList : [];
    normalizedLevels[standardKey] = arrayToMap.map((item: any, idx: number) => {
      if (typeof item === "string") {
        return {
          title: item,
          description: `Estudo de ${item}`,
          order: idx + 1,
          searchTerms: [item],
        };
      }
      const title = item?.t || item?.title || item?.name || `Tópico ${idx + 1}`;
      const description = item?.d || item?.description || item?.desc || "";
      const order =
        typeof item?.o === "number"
          ? item.o
          : typeof item?.order === "number"
          ? item.order
          : idx + 1;
      const searchTerms = Array.isArray(item?.s)
        ? item.s
        : Array.isArray(item?.searchTerms)
        ? item.searchTerms
        : [title];

      return {
        title,
        description,
        order,
        searchTerms,
      };
    });
  });

  const levelDefaults: Record<string, { title: string; description: string; searchTerms: string[] }[]> = {
    PREREQUISITES: [
      {
        title: `Fundamentos de ${roadmapTitle}`,
        description: `Conceitos essenciais e base teórica para iniciar os estudos`,
        searchTerms: [roadmapTitle, "fundamentos"],
      },
    ],
    BEGINNER: [
      {
        title: `Primeiros Passos com ${roadmapTitle}`,
        description: `Sintaxe e estrutura inicial básica`,
        searchTerms: [roadmapTitle, "iniciante"],
      },
      {
        title: `Ambiente e Configuração`,
        description: `Instalação de ferramentas e primeiro projeto prático`,
        searchTerms: [roadmapTitle, "setup"],
      },
    ],
    INTERMEDIATE: [
      {
        title: `Técnicas Intermediárias e Padrões`,
        description: `Padrões de projeto e melhores práticas de desenvolvimento`,
        searchTerms: [roadmapTitle, "boas praticas"],
      },
      {
        title: `Gerenciamento e Fluxo de Dados`,
        description: `Estruturação lógica e manipulação de informações`,
        searchTerms: [roadmapTitle, "dados"],
      },
    ],
    ADVANCED: [
      {
        title: `Arquitetura e Otimização Avançada`,
        description: `Performance, testes automatizados e escalabilidade`,
        searchTerms: [roadmapTitle, "arquitetura avancada"],
      },
      {
        title: `Segurança e Resiliência`,
        description: `Boas práticas de segurança e mitigação de vulnerabilidades`,
        searchTerms: [roadmapTitle, "seguranca"],
      },
    ],
    NEXT_STEPS: [
      {
        title: `Ecossistema e Produção`,
        description: `CI/CD, observabilidade e publicação de projetos`,
        searchTerms: [roadmapTitle, "producao devops"],
      },
    ],
  };

  // Guarantee that every single level has topics, even if the LLM omitted or truncated some levels
  Object.keys(normalizedLevels).forEach((lvl) => {
    if (!normalizedLevels[lvl] || normalizedLevels[lvl].length === 0) {
      normalizedLevels[lvl] = (levelDefaults[lvl] || []).map((t, idx) => ({
        ...t,
        order: idx + 1,
      }));
    }
  });

  return {
    roadmapTitle,
    levels: normalizedLevels,
  };
}

/**
 * Compact Challenge / Quiz parser (TOON)
 * q: question, o: options, a: correctAnswer, e: explanation
 * at: activity title, ad: activity desc, ar: activity reqs, as: activity solution
 */
export function parseCompactChallenge(data: any) {
  if (!data) return { questions: [], activity: null };

  const rawQuestions = Array.isArray(data.questions)
    ? data.questions
    : Array.isArray(data.qs)
    ? data.qs
    : [];
  const rawActivity = data.activity || data.ac || null;

  const questions = rawQuestions.map((q: any) => ({
    question: q?.question || q?.q || "Pergunta sobre o tópico",
    options:
      Array.isArray(q?.options) && q.options.length > 0
        ? q.options
        : Array.isArray(q?.o) && q.o.length > 0
        ? q.o
        : ["Opção A", "Opção B", "Opção C", "Opção D"],
    correctAnswer:
      typeof q?.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q?.a === "number"
        ? q.a
        : 0,
    explanation: q?.explanation || q?.e || "Explicação da resposta correta.",
  }));

  const activity = rawActivity
    ? {
        title: rawActivity.title || rawActivity.t || "Atividade Prática",
        description:
          rawActivity.description ||
          rawActivity.d ||
          "Implemente uma solução prática para fixar o conteúdo.",
        requirements: Array.isArray(rawActivity.requirements)
          ? rawActivity.requirements
          : Array.isArray(rawActivity.r)
          ? rawActivity.r
          : ["Praticar os conceitos estudados"],
        solution: rawActivity.solution || rawActivity.s || "",
      }
    : null;

  return { questions, activity };
}
