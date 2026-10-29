import { curateTopicService } from "@/src/services/contentService";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readBoolean, readContext, readEnum, readString } from "@/src/lib/validation";

const MODES = ["ai-driven", "research"] as const;

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, { rateLimitPerMinute: 30 });

    const topicTitle = readString(body.topicTitle, "topicTitle", { max: 200 });
    const mode = readEnum(body.mode, "mode", MODES, "ai-driven");
    const userDescription = readString(body.userDescription, "userDescription", {
      max: 500,
      required: false,
    });
    const roadmapContext = readContext(body.roadmapContext);
    const forceContent = readBoolean(body.forceContent);

    // AI-driven roadmaps always generate an explanation. Research roadmaps
    // only generate one when the user explicitly requests it (forceContent).
    const shouldGenerateContent = mode === "ai-driven" || forceContent;

    const result = await curateTopicService({
      topicTitle,
      shouldGenerateContent,
      contextDescription: userDescription || undefined,
      roadmapContext,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "/api/gemini/curate-content");
  }
}
