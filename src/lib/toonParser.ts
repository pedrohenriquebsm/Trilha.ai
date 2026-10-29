/**
 * TOON (Token-Oriented Object Notation) / Compact Notation Parser
 * Converts ultra-compact arrays or key-abbreviated JSON into standardized application types.
 */

import { Challenge, RoadmapDecomposition } from "@/src/types";

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
    PREREQUISITES: ["PREREQUISITES", "prerequisites", "prerequisitos", "pré-requisitos", "fundamentos", "basics", "fundamentals", "level0", "0", "p"],
    BEGINNER: ["BEGINNER", "beginner", "iniciante", "iniciantes", "basic", "level1", "1", "b"],
    INTERMEDIATE: ["INTERMEDIATE", "intermediate", "intermediario", "intermediário", "intermediarios", "core", "level2", "2", "i"],
    ADVANCED: ["ADVANCED", "advanced", "avancado", "avançado", "avancados", "expert", "level3", "3", "a"],
    NEXT_STEPS: ["NEXT_STEPS", "next_steps", "nextsteps", "proximos_passos", "próximos passos", "proximosPassos", "next", "future", "level4", "4", "n"],
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
    const seenTitles = new Set<string>();

    normalizedLevels[standardKey] = arrayToMap
      .map((item: any, idx: number) => {
        if (typeof item === "string") {
          return {
            title: item,
            description: `Estudo de ${item}`,
            order: idx + 1,
            searchTerms: [item],
          };
        }
        const title = item?.t || item?.title || item?.name || "";
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
      })
      .filter((topic: any) => {
        const title = typeof topic.title === "string" ? topic.title.trim() : "";
        if (!title) return false;
        const key = title.toLowerCase();
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      })
      .slice(0, 12)
      .map((topic: any, idx: number) => ({
        title: String(topic.title).trim().slice(0, 200),
        description: String(topic.description || "").trim().slice(0, 500),
        order: Number.isFinite(topic.order) ? Math.max(0, topic.order) : idx + 1,
        searchTerms: (Array.isArray(topic.searchTerms) ? topic.searchTerms : [topic.title])
          .filter((term: unknown) => typeof term === "string" && term.trim().length > 0)
          .map((term: string) => term.trim().slice(0, 80))
          .slice(0, 3),
      }));
  });

  // Never invent topics here. An empty level means the model failed; callers
  // must surface an error instead of silently charging a credit for a fake roadmap.
  return {
    roadmapTitle: String(roadmapTitle).trim().slice(0, 200) || "Trilha de Aprendizagem",
    levels: normalizedLevels,
  };
}

/**
 * Compact Challenge / Quiz parser (TOON)
 * q: question, o: options, a: correctAnswer, e: explanation
 * at: activity title, ad: activity desc, ar: activity reqs, as: activity solution
 */
export function parseCompactChallenge(data: any): Challenge {
  if (!data) return { questions: [], activity: null };

  const rawQuestions = Array.isArray(data.questions)
    ? data.questions
    : Array.isArray(data.qs)
    ? data.qs
    : [];
  const rawActivity = data.activity || data.ac || null;

  const questions = rawQuestions.slice(0, 5).flatMap((q: any) => {
    const question = String(q?.question || q?.q || "").trim();
    const rawOptions = Array.isArray(q?.options)
      ? q.options
      : Array.isArray(q?.o)
      ? q.o
      : [];
    const options = rawOptions
      .map((option: unknown) => String(option).trim())
      .filter((option: string) => option.length > 0)
      .slice(0, 6);

    // Skip malformed questions instead of inventing question/option text.
    if (!question || options.length < 2) return [];

    const rawAnswer =
      typeof q?.correctAnswer === "number"
        ? q.correctAnswer
        : typeof q?.a === "number"
        ? q.a
        : 0;

    return [
      {
        question: question.slice(0, 500),
        options: options.map((option: string) => option.slice(0, 300)),
        correctAnswer: rawAnswer >= 0 && rawAnswer < options.length ? rawAnswer : 0,
        explanation: String(q?.explanation || q?.e || "").trim().slice(0, 1000),
      },
    ];
  });

  const activityTitle = String(rawActivity?.title || rawActivity?.t || "").trim();
  const activity =
    rawActivity && activityTitle
      ? {
          title: activityTitle.slice(0, 200),
          description: String(rawActivity.description || rawActivity.d || "").trim().slice(0, 1500),
          requirements: (
            Array.isArray(rawActivity.requirements)
              ? rawActivity.requirements
              : Array.isArray(rawActivity.r)
              ? rawActivity.r
              : []
          )
            .filter((item: unknown) => typeof item === "string" && item.trim().length > 0)
            .slice(0, 10)
            .map((item: string) => item.trim().slice(0, 300)),
          solution: String(rawActivity.solution || rawActivity.s || "").trim().slice(0, 4000),
        }
      : null;

  return { questions, activity };
}
