/**
 * Parser for the compact curriculum format used by the `curriculum` route.
 *
 * Expected payload:
 *
 *   ```toon
 *   title: Banco de Dados: do básico à arquitetura
 *   topics[40]{lv|t|d|s}:
 *     0|Modelagem relacional|Tabelas chaves e normalização|sql modelagem
 *   ```
 *
 * The parser is intentionally deterministic and conservative: it never fills a
 * missing topic, never invents a description and throws when a level is too
 * thin. A failed generation must surface as an error (so `withRetry` can try
 * another model) instead of being persisted as a fake roadmap.
 */

import { RoadmapDecomposition } from "@/src/types";

export const CURRICULUM_LEVELS = [
  "PREREQUISITES",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "NEXT_STEPS",
] as const;

export const MIN_TOPICS_PER_LEVEL = 4;
export const MAX_TOPICS_PER_LEVEL = 12;
export const MIN_TOPIC_TITLE_LENGTH = 3;
export const MAX_TOPIC_TITLE_LENGTH = 80;
export const MAX_TOPIC_DESCRIPTION_LENGTH = 200;

export interface ParsedCurriculum {
  roadmapTitle: string;
  levels: RoadmapDecomposition["levels"];
  totalTopics: number;
}

const HEADER_PATTERN = /^\s*topics\s*\[\s*(\d+)\s*\]\s*\{([^}]*)\}\s*:\s*$/i;
const TITLE_PATTERN = /^\s*(?:title|trilha|roadmap)\s*:\s*(.+)$/i;

/**
 * Known drift targets: models love to turn any technical subject into a generic
 * "full stack developer" career. Only rejected when the user did not ask for it.
 */
const DRIFT_PATTERNS = [/\bfull\s*[- ]?stack\b/i, /\bdesenvolvedor\s+web\b/i, /\bcarreira\b/i];

function cleanField(value: string): string {
  return value
    .replace(/[`"'“”]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasTopicDrift(topic: string, title: string): boolean {
  const drifted = DRIFT_PATTERNS.some((pattern) => pattern.test(title));
  if (!drifted) return false;
  return !DRIFT_PATTERNS.some((pattern) => pattern.test(topic));
}

function emptyLevels(): RoadmapDecomposition["levels"] {
  return {
    PREREQUISITES: [],
    BEGINNER: [],
    INTERMEDIATE: [],
    ADVANCED: [],
    NEXT_STEPS: [],
  };
}

/** Extracts the fenced block when present, otherwise returns the raw text. */
export function extractCurriculumBlock(raw: string): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:toon|text|txt)?\s*([\s\S]*?)```/i);
  return fenced ? fenced[1] : raw;
}

export function parseCurriculumToon(raw: string, topic: string): ParsedCurriculum {
  const block = extractCurriculumBlock(raw);
  if (!block.trim()) {
    throw new Error("A IA não retornou a grade curricular.");
  }

  const safeTopic = cleanField(topic || "").slice(0, 200);
  let roadmapTitle = safeTopic || "Trilha de Aprendizagem";

  const rows: string[] = [];
  let declaredCount: number | null = null;
  let headerFound = false;
  let fieldOrder: string[] = ["lv", "t", "d", "s"];

  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (!headerFound) {
      const titleMatch = line.match(TITLE_PATTERN);
      if (titleMatch) {
        const parsedTitle = cleanField(titleMatch[1]).slice(0, 200);
        if (parsedTitle) roadmapTitle = parsedTitle;
        continue;
      }

      const header = line.match(HEADER_PATTERN);
      if (header) {
        declaredCount = Number(header[1]);
        const declaredFields = header[2]
          .split(/[|,]/)
          .map((field) => field.trim().toLowerCase())
          .filter(Boolean);
        if (declaredFields.length === 4) fieldOrder = declaredFields;
        headerFound = true;
      }
      continue;
    }

    // A second header means the model restarted; ignore everything after it.
    if (HEADER_PATTERN.test(line)) break;

    rows.push(line.replace(/^[-*]\s*/, ""));
  }

  if (!headerFound || declaredCount === null) {
    throw new Error("A IA retornou a grade curricular em um formato inesperado.");
  }

  const levels = emptyLevels();
  const seenTitles = new Set<string>();

  for (const row of rows) {
    // Accept both the pipe form from the prompt and the default TOON comma form.
    const delimiter = row.includes("|") ? "|" : ",";
    const parts = row.split(delimiter).map(cleanField);
    if (parts.length !== fieldOrder.length) continue;

    const field = (name: string) => {
      const index = fieldOrder.indexOf(name);
      return index >= 0 ? parts[index] : "";
    };

    const level = Number.parseInt(field("lv"), 10);
    if (!Number.isInteger(level) || level < 0 || level >= CURRICULUM_LEVELS.length) continue;

    const title = field("t").slice(0, MAX_TOPIC_TITLE_LENGTH);
    if (title.length < MIN_TOPIC_TITLE_LENGTH) continue;
    if (hasTopicDrift(safeTopic, title)) continue;

    const key = normalizeTitleKey(title);
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);

    const description = field("d").slice(0, MAX_TOPIC_DESCRIPTION_LENGTH);
    const searchTerms = field("s")
      .split(/[\s,]+/)
      .map(cleanField)
      .filter(Boolean)
      .slice(0, 3);

    levels[CURRICULUM_LEVELS[level]].push({
      title,
      description,
      order: 0,
      searchTerms: searchTerms.length > 0 ? searchTerms : [title],
    });
  }

  let totalTopics = 0;

  for (const levelName of CURRICULUM_LEVELS) {
    const topics = levels[levelName].slice(0, MAX_TOPICS_PER_LEVEL);
    levels[levelName] = topics.map((topicItem, index) => ({ ...topicItem, order: index + 1 }));
    totalTopics += levels[levelName].length;

    if (levels[levelName].length < MIN_TOPICS_PER_LEVEL) {
      throw new Error(
        `A IA retornou apenas ${levels[levelName].length} tópico(s) em ${levelName}; esperado pelo menos ${MIN_TOPICS_PER_LEVEL}.`
      );
    }
  }

  return { roadmapTitle, levels, totalTopics };
}
