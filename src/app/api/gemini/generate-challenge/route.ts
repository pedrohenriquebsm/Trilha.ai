import { callLLM, withRetry } from "@/src/lib/llm";
import { parseCompactChallenge } from "@/src/lib/toonParser";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readString } from "@/src/lib/validation";
import { ApiError } from "@/src/lib/apiError";
import { extractJsonCandidate, parseLooseJson } from "@/src/lib/llmJson";
import type { Challenge } from "@/src/types";

function parseChallengeJson(content: string): any {
  const candidate = extractJsonCandidate(content);

  // Code snippets often contain unescaped quotes in the final "s" (solution)
  // field. Repair that specific pattern before giving up.
  const repaired = candidate.replace(
    /"s"\s*:\s*"(.*?)"\s*}\s*}\s*$/s,
    (_match, code: string) => `"s":${JSON.stringify(code)}}`
  );

  try {
    return parseLooseJson(repaired);
  } catch {
    // Do not fabricate a quiz when the model returns malformed JSON. Throwing
    // lets withRetry try another model; if all attempts fail, the user gets an
    // honest error instead of fake questions.
    throw new ApiError(502, "Não foi possível decodificar o desafio retornado pela IA.");
  }
}

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, { rateLimitPerMinute: 30 });

    const topicTitle = readString(body.topicTitle, "topicTitle", { max: 200 });
    const topicContent = readString(body.topicContent, "topicContent", {
      max: 8_000,
      required: false,
    });

    const result = await withRetry(async (model) => {
      const response = await callLLM(
        [
          {
            role: "system",
            content:
              "Tech instructor. Caveman style: ultra-dense, precise, zero fluff. Output ONLY TOON JSON. Rules: Valid JSON only. In code snippets, use single quotes (') instead of double quotes (\").",
          },
          {
            role: "user",
            content: `Topic: "${topicTitle}". Context: "${topicContent.substring(0, 300)}"
Create 2 multiple-choice questions (4 options) and 1 practical challenge.
Format TOON JSON:
{"qs":[{"q":"question","o":["opt1","opt2","opt3","opt4"],"a":0,"e":"short explanation"}],"ac":{"t":"title","d":"short desc","r":["req1","req2"],"s":"concise solution"}}`,
          },
        ],
        1500,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim() || "";
      const raw = parseChallengeJson(content);
      const parsed: Challenge = parseCompactChallenge(raw);

      if (parsed.questions.length === 0 && !parsed.activity) {
        throw new Error("A IA não retornou um desafio válido.");
      }

      return parsed;
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "/api/gemini/generate-challenge");
  }
}
