import { callLLM, PROMPT_ENHANCER_SYSTEM_PROMPT, withRetry } from "@/src/lib/llm";
import { apiSuccess } from "@/src/lib/apiResponse";
import { guardApiRequest, handleApiError } from "@/src/lib/apiGuard";
import { readString } from "@/src/lib/validation";

export async function POST(req: Request) {
  try {
    const { body } = await guardApiRequest(req, {
      requireCredits: true,
      rateLimitPerMinute: 20,
    });

    const input = readString(body.input, "input", { max: 200 });

    const enhanced = await withRetry(async (model) => {
      const response = await callLLM(
        [
          { role: "system", content: PROMPT_ENHANCER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Tema da trilha: "${input}". Detalhe o escopo técnico desse assunto mantendo fidelidade estrita ao tema.`,
          },
        ],
        600,
        model
      );

      let text = response.choices?.[0]?.message?.content?.trim() || "";
      text = text.replace(/^["'\s]+|["'\s]+$/g, "");
      return text || input;
    });

    return apiSuccess({ enhanced });
  } catch (error) {
    return handleApiError(error, "/api/gemini/enhance-prompt");
  }
}
