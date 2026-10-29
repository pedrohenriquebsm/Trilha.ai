import { callLLM, AGENT_2_CURRICULUM_ARCHITECT, withRetry } from "@/src/lib/llm";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { topic, enhancedPrompt } = await req.json();
    if (!topic && !enhancedPrompt) {
      return apiError("O parâmetro 'topic' ou 'enhancedPrompt' é obrigatório.", 400);
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
  } catch (error: any) {
    console.error("Error in /api/gemini/list-topics:", error);
    return apiError(error?.message || "Erro ao gerar grade de tópicos.", 500);
  }
}
