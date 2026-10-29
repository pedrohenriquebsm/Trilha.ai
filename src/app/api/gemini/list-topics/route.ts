import { callLLM, AGENT_2_CURRICULUM_ARCHITECT, withRetry } from "@/src/lib/llm";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readString, ValidationError } from "@/src/lib/validation";

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, {
      requireCredits: true,
      rateLimitPerMinute: 20,
    });

    const topic = readString(body.topic, "topic", { max: 200, required: false });
    const enhancedPrompt = readString(body.enhancedPrompt, "enhancedPrompt", {
      max: 2000,
      required: false,
    });

    if (!topic && !enhancedPrompt) {
      throw new ValidationError("O parâmetro 'topic' ou 'enhancedPrompt' é obrigatório.");
    }

    const mainTopic = topic || enhancedPrompt;
    const scope = enhancedPrompt || topic;

    const topicListText = await withRetry(async (model) => {
      const response = await callLLM(
        [
          { role: "system", content: AGENT_2_CURRICULUM_ARCHITECT },
          {
            role: "user",
            content: `Tema Principal: "${mainTopic}"\nEscopo e Detalhamento: "${scope}"\n\nCrie a grade curricular com os tópicos essenciais e suas descrições para os 5 níveis (PREREQUISITES, BEGINNER, INTERMEDIATE, ADVANCED, NEXT_STEPS). Mantenha foco estrito em "${mainTopic}".`,
          },
        ],
        2500,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new Error("O Agente Curricular não retornou conteúdo.");
      }
      return content;
    });

    return apiSuccess({ topicListText });
  } catch (error) {
    return handleApiError(error, "/api/gemini/list-topics");
  }
}
