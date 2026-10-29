import { callLLM, AGENT_4_ROADMAP_SERIALIZER, withRetry } from "@/src/lib/llm";
import { parseCompactRoadmap } from "@/src/lib/toonParser";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

function parseJsonFromLlmResponse(content: string, fallbackTitle: string): any {
  let cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const sanitized = cleaned
    .replace(/\[\s*\.{2,}\s*\]/g, "[]")
    .replace(/,\s*\.{2,}/g, "")
    .replace(/\.{2,}\s*,/g, "")
    .replace(/,\s*([\]}])/g, "$1");

  try {
    return JSON.parse(sanitized);
  } catch {
    try {
      return JSON.parse(cleaned);
    } catch {}

    const heavySanitized = sanitized
      .replace(/\.{3,}/g, "")
      .replace(/,\s*,/g, ",")
      .replace(/\[\s*,/g, "[")
      .replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(heavySanitized);
    } catch {
      console.warn("Could not parse JSON from serializer agent, using fallback for:", fallbackTitle);
      return {
        rt: fallbackTitle,
        lv: {
          PREREQUISITES: [],
          BEGINNER: [],
          INTERMEDIATE: [],
          ADVANCED: [],
          NEXT_STEPS: [],
        },
      };
    }
  }
}

export async function POST(req: Request) {
  try {
    const { topic, topicListText, referencesText } = await req.json();
    if (!topic) {
      return apiError("O parâmetro 'topic' é obrigatório.", 400);
    }

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

      const rawParsed = parseJsonFromLlmResponse(content, topic);

      // Guard against topic drift
      if (rawParsed) {
        const lowerTopic = topic.toLowerCase();
        const lowerRt = (rawParsed.rt || "").toLowerCase();
        const isGenericDevHallucination =
          (lowerRt.includes("full stack") || lowerRt.includes("desenvolvedor web")) &&
          !lowerTopic.includes("full stack") &&
          !lowerTopic.includes("web");

        if (isGenericDevHallucination || !rawParsed.rt) {
          rawParsed.rt = topic;
        }
      }

      return parseCompactRoadmap(rawParsed);
    });

    return apiSuccess({ topicTree: result });
  } catch (error: any) {
    console.error("Error in /api/gemini/structure-roadmap:", error);
    return apiError(error?.message || "Erro ao serializar e estruturar o roadmap.", 500);
  }
}
