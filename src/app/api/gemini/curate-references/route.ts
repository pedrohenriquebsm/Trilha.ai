import { callLLM, AGENT_3_REFERENCES_CURATOR, withRetry } from "@/src/lib/llm";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { ApiError } from "@/src/lib/apiError";
import { readString, ValidationError } from "@/src/lib/validation";

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

    const referencesText = await withRetry(async (model) => {
      const response = await callLLM(
        [
          { role: "system", content: AGENT_3_REFERENCES_CURATOR },
          {
            role: "user",
            content: `Tema: "${topic}"\n\nGrade de Tópicos Planejada:\n${topicListText || "Fundamentos a tópicos avançados de " + topic}\n\nIndique as melhores referências canônicas (documentações oficiais, livros clássicos consagrados, guias confiáveis) para esse tema.`,
          },
        ],
        2000,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim();
      return content || "Documentações oficiais e materiais canônicos recomendados.";
    });

    return apiSuccess({ referencesText });
  } catch (error) {
    // Auth/validation/rate-limit errors must not be masked by the fallback.
    if (error instanceof ApiError || error instanceof ValidationError) {
      return handleApiError(error, "/api/gemini/curate-references");
    }
    // Non-blocking fallback: a falha do Agente 3 não deve impedir a trilha.
    console.warn("/api/gemini/curate-references fallback:", error);
    return apiSuccess({ referencesText: "Documentações técnicas oficiais e literatura recomendada." });
  }
}
