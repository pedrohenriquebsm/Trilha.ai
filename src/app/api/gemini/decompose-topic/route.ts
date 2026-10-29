import { callLLM, TOPIC_DECOMPOSER_SYSTEM_PROMPT, withRetry } from "@/src/lib/llm";
import { parseCompactRoadmap } from "@/src/lib/toonParser";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

function parseJsonFromLlmResponse(content: string, fallbackTitle: string): any {
  // Remove markdown code fences if present
  let cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

  // If there are thoughts or reasoning text before or after the JSON
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  // Pre-clean invalid ellipsis patterns commonly outputted by LLMs (e.g., [...] or , ...)
  const sanitized = cleaned
    .replace(/\[\s*\.{2,}\s*\]/g, "[]") // replace [...] with []
    .replace(/,\s*\.{2,}/g, "")         // replace , ... with nothing
    .replace(/\.{2,}\s*,/g, "")         // replace ... , with nothing
    .replace(/,\s*([\]}])/g, "$1");     // remove trailing commas before } or ]

  try {
    return JSON.parse(sanitized);
  } catch {
    try {
      return JSON.parse(cleaned);
    } catch {}

    // Further sanitization: remove any remaining literal ... inside arrays or objects
    const heavySanitized = sanitized
      .replace(/\.{3,}/g, "")
      .replace(/,\s*,/g, ",")
      .replace(/\[\s*,/g, "[")
      .replace(/,\s*([\]}])/g, "$1");

    try {
      return JSON.parse(heavySanitized);
    } catch {
      console.warn("Could not parse JSON from LLM output, using resilient fallback for:", fallbackTitle);
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
    const { enhancedPrompt, originalTopic } = await req.json();
    const effectiveTopic = originalTopic || enhancedPrompt;
    if (!effectiveTopic) {
      return apiError("O parâmetro 'originalTopic' ou 'enhancedPrompt' é obrigatório.", 400);
    }

    const userPromptContent = originalTopic
      ? `Tópico Principal Solicitado: "${originalTopic}".\nDetalhamento do Escopo: "${enhancedPrompt || originalTopic}".\nLEMBRE-SE: A trilha deve focar 100% no assunto "${originalTopic}". O título em "rt" DEVE conter expressamente "${originalTopic}".`
      : `Tópico da Trilha: "${enhancedPrompt}".`;

    const result = await withRetry(async (model) => {
      const response = await callLLM(
        [
          { role: "system", content: TOPIC_DECOMPOSER_SYSTEM_PROMPT },
          { role: "user", content: userPromptContent },
        ],
        4000,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("A IA retornou uma resposta vazia.");
      }

      const rawParsed = parseJsonFromLlmResponse(content, effectiveTopic);

      // Guard against topic drift if the AI hallucinates an unrelated career
      if (originalTopic && rawParsed) {
        const lowerOriginal = originalTopic.toLowerCase();
        const lowerRt = (rawParsed.rt || "").toLowerCase();
        const isGenericDevHallucination =
          (lowerRt.includes("full stack") || lowerRt.includes("desenvolvedor web")) &&
          !lowerOriginal.includes("full stack") &&
          !lowerOriginal.includes("web");

        if (isGenericDevHallucination || !rawParsed.rt) {
          rawParsed.rt = originalTopic;
        }
      }

      return parseCompactRoadmap(rawParsed);
    });

    return apiSuccess({ topicTree: result });
  } catch (error: any) {
    console.error("Error in /api/gemini/decompose-topic:", error);
    return apiError(error?.message || "Erro ao decompor tópico em roadmap.", 500);
  }
}
