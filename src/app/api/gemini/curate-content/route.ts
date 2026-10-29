import { curateTopicService } from "@/src/services/contentService";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { topicTitle, mode, roadmapContext, userDescription } = await req.json();
    if (!topicTitle) {
      return apiError("O parâmetro 'topicTitle' é obrigatório.", 400);
    }

    const isAiDriven = mode === "ai-driven";
    const result = await curateTopicService({
      topicTitle,
      shouldGenerateContent: isAiDriven,
      contextDescription: userDescription,
      roadmapContext,
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error(`Error in /api/gemini/curate-content:`, error);
    return apiError(error?.message || "Erro ao curar conteúdo do tópico.", 500);
  }
}
