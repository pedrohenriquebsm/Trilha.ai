import { curateTopicService } from "@/src/services/contentService";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { topicTitle, userDescription, shouldGenerateContent, roadmapContext } = await req.json();
    if (!topicTitle) {
      return apiError("O parâmetro 'topicTitle' é obrigatório.", 400);
    }

    const result = await curateTopicService({
      topicTitle,
      shouldGenerateContent: Boolean(shouldGenerateContent),
      contextDescription: userDescription,
      roadmapContext,
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error(`Error in /api/gemini/topic-content-and-sources:`, error);
    return apiError(error?.message || "Erro ao gerar conteúdo e fontes do tópico.", 500);
  }
}
