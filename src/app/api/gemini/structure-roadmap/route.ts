import { callLLM, AGENT_4_ROADMAP_SERIALIZER, withRetry } from "@/src/lib/llm";
import { parseCompactRoadmap } from "@/src/lib/toonParser";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readString } from "@/src/lib/validation";
import { parseLooseJson } from "@/src/lib/llmJson";

function countTopics(levels: Record<string, unknown[]>): number {
  return Object.values(levels).reduce(
    (total, topics) => total + (Array.isArray(topics) ? topics.length : 0),
    0
  );
}

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, {
      requireCredits: true,
      rateLimitPerMinute: 20,
    });

    const topic = readString(body.topic, "topic", { max: 200 });
    const topicListText = readString(body.topicListText, "topicListText", {
      max: 20_000,
      required: false,
    });
    const referencesText = readString(body.referencesText, "referencesText", {
      max: 8_000,
      required: false,
    });

    const result = await withRetry(async (model) => {
      const response = await callLLM(
        [
          { role: "system", content: AGENT_4_ROADMAP_SERIALIZER },
          {
            role: "user",
            content: `Tema: "${topic}"\n\nGrade de Tópicos e Descrições:\n${topicListText || topic}\n\nReferências Recomendadas:\n${referencesText || "Documentações oficiais"}\n\nTransforme esses dados no JSON padronizado com os 5 níveis (PREREQUISITES, BEGINNER, INTERMEDIATE, ADVANCED, NEXT_STEPS).`,
          },
        ],
        3000,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("O Agente Serializador retornou conteúdo vazio.");
      }

      const rawParsed = parseLooseJson<any>(content);

      // Guard against topic drift
      if (rawParsed) {
        const lowerTopic = topic.toLowerCase();
        const lowerRt = String(rawParsed.rt || "").toLowerCase();
        const isGenericDevHallucination =
          (lowerRt.includes("full stack") || lowerRt.includes("desenvolvedor web")) &&
          !lowerTopic.includes("full stack") &&
          !lowerTopic.includes("web");

        if (isGenericDevHallucination || !rawParsed.rt) {
          rawParsed.rt = topic;
        }
      }

      const parsed = parseCompactRoadmap(rawParsed);
      const totalTopics = countTopics(parsed.levels as unknown as Record<string, unknown[]>);

      if (totalTopics === 0) {
        throw new Error("A IA não retornou nenhum tópico válido para esta trilha.");
      }

      return parsed;
    });

    return apiSuccess({ topicTree: result });
  } catch (error) {
    return handleApiError(error, "/api/gemini/structure-roadmap");
  }
}
