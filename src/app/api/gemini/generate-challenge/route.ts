import { callLLM, withRetry } from "@/src/lib/llm";
import { parseCompactChallenge } from "@/src/lib/toonParser";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

function parseJsonFromLlmResponse(content: string): any {
  const cleaned = content.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // If failure is due to unescaped quotes inside code property "s": "..."
    const sMatch = cleaned.match(/"s"\s*:\s*"(.*?)"\s*}\s*}\s*$/s);
    if (sMatch) {
      try {
        const fixedS = sMatch[1].replace(/"/g, '\\"');
        const fixedStr = cleaned.replace(sMatch[0], `"s":"${fixedS}"}}`);
        return JSON.parse(fixedStr);
      } catch {}
    }

    // Try finding outer braces
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(content.substring(firstBrace, lastBrace + 1));
      } catch {}
    }

    // Resilient fallback extraction for questions
    const qMatches = [...content.matchAll(/"q"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
    if (qMatches.length > 0) {
      return {
        qs: qMatches.map((q) => ({
          q,
          o: [
            "Conceito fundamental A",
            "Conceito alternativo B",
            "Definição incorreta C",
            "Abordagem legada D",
          ],
          a: 0,
          e: "Revise os conceitos do tópico para consolidar este ponto.",
        })),
        ac: {
          t: "Exercício Prático",
          d: "Escreva um código demonstrando a aplicação deste tópico.",
          r: ["Criar implementação", "Testar funcionamento"],
          s: "// Implementação prática recomendada",
        },
      };
    }

    throw new Error("Não foi possível decodificar o JSON do desafio.");
  }
}

export async function POST(req: Request) {
  try {
    const { topicTitle, topicContent } = await req.json();
    if (!topicTitle) {
      return apiError("O parâmetro 'topicTitle' é obrigatório.", 400);
    }

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
            content: `Topic: "${topicTitle}". Context: "${(topicContent || "").substring(0, 300)}"
Create 2 multiple-choice questions (4 options) and 1 practical challenge.
Format TOON JSON:
{"qs":[{"q":"question","o":["opt1","opt2","opt3","opt4"],"a":0,"e":"short explanation"}],"ac":{"t":"title","d":"short desc","r":["req1","req2"],"s":"concise solution"}}`,
          },
        ],
        1500,
        model
      );

      const content = response.choices?.[0]?.message?.content?.trim() || "";
      const raw = parseJsonFromLlmResponse(content);
      return parseCompactChallenge(raw);
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error(`Error generating challenge:`, error);
    return apiError(error?.message || "Não foi possível gerar o desafio no momento.", 500);
  }
}
