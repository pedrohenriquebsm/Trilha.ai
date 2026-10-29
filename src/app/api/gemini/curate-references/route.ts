import { callLLM, AGENT_3_REFERENCES_CURATOR, withRetry } from "@/src/lib/llm";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { topic, topicListText } = await req.json();
    if (!topic) {
      return apiError("O parâmetro 'topic' é obrigatório.", 400);
    }

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
  } catch (error: any) {
    console.error("Error in /api/gemini/curate-references:", error);
    // Non-blocking fallback for references
    return apiSuccess({ referencesText: "Documentações técnicas oficiais e literatura recomendada." });
  }
}
