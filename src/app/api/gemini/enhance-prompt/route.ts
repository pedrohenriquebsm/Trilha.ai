import { callLLM, PROMPT_ENHANCER_SYSTEM_PROMPT, withRetry } from "@/src/lib/llm";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    if (!input) {
      return apiError("O parâmetro 'input' é obrigatório.", 400);
    }

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
  } catch (error: any) {
    console.error("Error in /api/gemini/enhance-prompt:", error);
    return apiError(error?.message || "Erro ao aprimorar o prompt com IA.", 500);
  }
}
