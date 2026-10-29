import { curateTopicService } from "@/src/services/contentService";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readBoolean, readContext, readString } from "@/src/lib/validation";

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, { rateLimitPerMinute: 30 });

    const topicTitle = readString(body.topicTitle, "topicTitle", { max: 200 });
    const userDescription = readString(body.userDescription, "userDescription", {
      max: 500,
      required: false,
    });
    const roadmapContext = readContext(body.roadmapContext);

    const result = await curateTopicService({
      topicTitle,
      shouldGenerateContent: readBoolean(body.shouldGenerateContent),
      contextDescription: userDescription || undefined,
      roadmapContext,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "/api/gemini/topic-content-and-sources");
  }
}
