import {
  AGENT_CURRICULUM,
  buildCurriculumUserPrompt,
  callLLM,
  MODEL_ROLES,
  MODELS,
  withRetry,
} from "@/src/lib/llm";
import { parseCurriculumToon } from "@/src/lib/curriculumParser";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readString } from "@/src/lib/validation";

/** Tokens needed for 40 one-line topics plus the `title:` line. */
const CURRICULUM_MAX_TOKENS = 900;

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, {
      requireCredits: true,
      rateLimitPerMinute: 20,
    });

    const topic = readString(body.topic, "topic", { max: 200 });
    const scope = readString(body.scope, "scope", { max: 800, required: false });

    // Pinned curriculum model first, then the usual fallback rotation.
    const models = Array.from(new Set([MODEL_ROLES.curriculum, ...MODELS]));

    const result = await withRetry(
      async (model) => {
        const response = await callLLM(
          [
            { role: "system", content: AGENT_CURRICULUM },
            { role: "user", content: buildCurriculumUserPrompt(topic, scope) },
          ],
          CURRICULUM_MAX_TOKENS,
          model,
          undefined,
          { reasoning: false, temperature: 0 }
        );

        const content = response.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new Error("A IA não retornou a grade curricular.");
        }

        // Throws when a level is too thin, so withRetry can try another model
        // instead of persisting an incomplete roadmap.
        return parseCurriculumToon(content, topic);
      },
      2,
      1500,
      models
    );

    return apiSuccess({
      topicTree: {
        roadmapTitle: result.roadmapTitle,
        levels: result.levels,
      },
      totalTopics: result.totalTopics,
    });
  } catch (error) {
    return handleApiError(error, "/api/gemini/curriculum");
  }
}
