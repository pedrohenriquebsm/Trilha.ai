import { callLLM, withRetry, AGENT_1_PROMPT_OPTIMIZER, AGENT_2_LEVEL_GENERATOR, AGENT_3_TOPIC_OVERVIEW, AGENT_4_JSON_FORMATTER } from "@/src/lib/llm";
import { parseLooseJson } from "@/src/lib/llmJson";
import { apiError, apiSuccess } from "@/src/lib/apiResponse";

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) return apiError("Tópico é obrigatório", 400);

    // 1. Otimizar Escopo
    const scope = await withRetry(async (model) => {
      const res = await callLLM([{ role: "user", content: `Tópico: ${topic}\n\n${AGENT_1_PROMPT_OPTIMIZER}` }], 500, model);
      return res.choices[0].message.content || "";
    });

    // 2. Gerar Tópicos por Nível (Sequencial)
    const niveis = ["PREREQUISITES", "BEGINNER", "INTERMEDIATE", "ADVANCED", "NEXT_STEPS"];
    let contextoNiveis = "";
    const resultadosPorNivel: Record<string, string> = {};

    for (const nivel of niveis) {
      const res = await withRetry(async (model) => {
        const prompt = AGENT_2_LEVEL_GENERATOR
          .replace("{contexto_anterior}", contextoNiveis)
          .replace("{escopo}", scope)
          .replace("{nivel_atual}", nivel);
        const completion = await callLLM([{ role: "user", content: prompt }], 1000, model);
        return completion.choices[0].message.content || "";
      });
      resultadosPorNivel[nivel] = res;
      contextoNiveis += `\nNível ${nivel}:\n${res}\n`;
    }

    // 3. Criar Visão Geral dos Tópicos
    const visoesGerais = await withRetry(async (model) => {
      const prompt = AGENT_3_TOPIC_OVERVIEW.replace("{lista_topicos}", contextoNiveis);
      const res = await callLLM([{ role: "user", content: prompt }], 2000, model);
      return res.choices[0].message.content || "";
    });

    // 4. Formatar JSON Final
    const finalJson = await withRetry(async (model) => {
      const prompt = `${AGENT_4_JSON_FORMATTER}\n\nCONTEXTO:\n${contextoNiveis}\nVISÃO GERAL:\n${visoesGerais}`;
      const res = await callLLM([{ role: "user", content: prompt }], 2000, model);
      const rawContent = res.choices[0].message.content || "";
      console.log("LLM Raw Output for JSON:", rawContent.substring(0, 500));
      
      const parsed = parseLooseJson(rawContent) as any;
      
      // Defensive fix: If lv is missing but levels are directly at root, map them.
      if (!parsed.lv && parsed.PREREQUISITES) {
          return {
              rt: parsed.rt || "Trilha Gerada",
              lv: {
                  PREREQUISITES: parsed.PREREQUISITES,
                  BEGINNER: parsed.BEGINNER,
                  INTERMEDIATE: parsed.INTERMEDIATE,
                  ADVANCED: parsed.ADVANCED,
                  NEXT_STEPS: parsed.NEXT_STEPS
              }
          };
      }
      return parsed;
    });

    return apiSuccess({ roadmap: finalJson });
  } catch (error: any) {
    console.error("Erro no orquestrador:", error);
    return apiError(error.message || "Falha ao gerar trilha", 500);
  }
}
