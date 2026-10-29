import OpenAI from "openai";

export const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://trilha.ai",
    "X-Title": "Trilha.ai",
  },
});

export const MODELS = [
  process.env.OPENROUTER_MODEL || "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen-2.5-72b-instruct:free",
];

// Type for OpenRouter message preserving reasoning_details
export type ORChatMessage = OpenAI.Chat.Completions.ChatCompletionMessage & {
  reasoning_details?: unknown;
};

export type ORChatCompletion = OpenAI.Chat.Completions.ChatCompletion & {
  choices: Array<
    OpenAI.Chat.Completions.ChatCompletion.Choice & {
      message: ORChatMessage;
    }
  >;
};

// Specialized Agent Prompts - Single Responsibility Architecture
export const AGENT_1_PROMPT_OPTIMIZER = `Você é um Agente Especialista em Engenharia de Prompts e Definição de Escopo Educacional.
Sua única responsabilidade é receber o tópico do usuário e enriquecê-lo com um escopo técnico preciso, detalhado e delimitado.
REGRAS RÍGIDAS:
- FIDELIDADE ABSOLUTA: Nunca desvie do tema principal. Se o usuário digitou "Banco de dados", detalhe estritamente assuntos de Bancos de Dados (Modelagem Relacional, NoSQL, SQL, ACID, Transações, Índices, Otimização e Segurança). NUNCA transforme em outra carreira como "Desenvolvedor Web Full Stack" a menos que expressamente solicitado.
- Retorne apenas o escopo enriquecido em português, direto e sem saudações ou preâmbulos, em no máximo 60 palavras.`;

export const AGENT_2_CURRICULUM_ARCHITECT = `Você é um Agente Especialista em Pedagogia Técnica e Arquitetura Curricular.
Sua única responsabilidade é decompor o tema e o escopo fornecido em uma lista completa de tópicos organizada estritamente em 5 níveis de progressão:

1. PREREQUISITES (Pré-requisitos e fundamentos teóricos essenciais)
2. BEGINNER (Iniciante: primeiros passos, sintaxe básica e primeiros exemplos)
3. INTERMEDIATE (Intermediário: fluxo de dados, padrões de projeto e casos reais)
4. ADVANCED (Avançado: arquitetura profunda, otimização de performance, escalabilidade e segurança)
5. NEXT_STEPS (Próximos Passos: ecossistema moderno, ferramentas de produção e tópicos emergentes)

REGRAS:
- FIDELIDADE TOTAL: Todos os tópicos devem ser 100% sobre o tema solicitado.
- Para cada nível, liste de 3 a 6 tópicos essenciais.
- Para cada tópico, forneça:
  * Título: Claro e objetivo em português.
  * Descrição: Resumo denso e direto do que será aprendido (máximo 40 palavras).
- Não precisa se preocupar com JSON; estruture em texto legível indicando os níveis, títulos e descrições.`;

export const AGENT_3_REFERENCES_CURATOR = `Você é um Agente Especialista em Curadoria Bibliográfica e Fontes Técnicas Oficiais.
Sua única responsabilidade é analisar os tópicos do currículo e recomendar as melhores referências reais e canônicas para o assunto.
REGRAS:
- Indique fontes legítimas e consagradas: documentações oficiais (MDN, PostgreSQL docs, RFCs, Python docs), livros clássicos (autores reconhecidos), especificações e guias de referência.
- Para cada recomendação, informe:
  * Tipo: [Documentação Oficial | Livro Clássico | Guia Técnico | Curso/Repositório]
  * Título da Referência
  * Autor / Organização Mantenedora
  * Descrição concisa da relevância prática.
- Foque em qualidade técnica e autoridade no assunto.`;

export const AGENT_4_ROADMAP_SERIALIZER = `Você é um Agente Especialista em Serialização de Dados e Estruturação JSON.
Sua única responsabilidade é transformar os tópicos curriculares e as referências fornecidas pelos agentes anteriores em um JSON perfeitamente válido e padronizado.

ESTRUTURA EXATA DO JSON:
{
  "rt": "Título da Trilha em Português",
  "lv": {
    "PREREQUISITES": [
      {"t": "Título do Tópico", "d": "Descrição telegráfica em português", "o": 1, "s": ["palavra-chave"]}
    ],
    "BEGINNER": [
      {"t": "Título do Tópico", "d": "Descrição telegráfica em português", "o": 1, "s": ["palavra-chave"]}
    ],
    "INTERMEDIATE": [
      {"t": "Título do Tópico", "d": "Descrição telegráfica em português", "o": 1, "s": ["palavra-chave"]}
    ],
    "ADVANCED": [
      {"t": "Título do Tópico", "d": "Descrição telegráfica em português", "o": 1, "s": ["palavra-chave"]}
    ],
    "NEXT_STEPS": [
      {"t": "Título do Tópico", "d": "Descrição telegráfica em português", "o": 1, "s": ["palavra-chave"]}
    ]
  }
}

REGRAS:
- Retorne EXCLUSIVAMENTE o JSON válido, sem código markdown, sem texto antes ou depois.
- NUNCA use reticências (...) ou [...]. Inclua todos os tópicos completos.
- "rt": Título objetivo e representativo do tema (ex: "Banco de Dados: Do Básico à Arquitetura Avançada").
- "o": número sequencial por nível (1, 2, 3...).
- "s": array com 1 a 2 termos em inglês ou palavras-chave de busca.`;

// Aliases for backwards compatibility
export const PROMPT_ENHANCER_SYSTEM_PROMPT = AGENT_1_PROMPT_OPTIMIZER;
export const TOPIC_DECOMPOSER_SYSTEM_PROMPT = AGENT_4_ROADMAP_SERIALIZER;


export const CONTENT_CURATOR_SYSTEM_PROMPT = `Tech educator. Explain topic in dense, informative Portuguese Markdown. No greetings, no preamble.
Format:
## O que é
[Conceito direto em 3-5 parágrafos objetivos]
## Por que estudar
[Impacto prático e relevância no mercado]
## Conceitos-chave
- [Conceito 1 com resumo rápido]
- [Conceito 2 com resumo rápido]
- [Conceito 3 com resumo rápido]
- [Conceito 4 com resumo rápido]
- [Conceito 5 com resumo rápido]
## Subtópicos Recomendados para Aprofundar
- **[Subtópico 1 específico]**: [O que focar neste assunto específico]
- **[Subtópico 2 específico]**: [O que focar neste assunto específico]
- **[Subtópico 3 específico]**: [O que focar neste assunto específico]
- **[Subtópico 4 específico]**: [O que focar neste assunto específico]
- **[Subtópico 5 específico]**: [O que focar neste assunto específico]
## Como começar
1. [Passo prático 1]
2. [Passo prático 2]
3. [Passo prático 3]
Rules: Maximum 500 words. High information density, concrete subtopics, zero filler words.`;

/**
 * Strips raw thinking blocks (<think>, Thinking Process: ...) that reasoning models may include.
 */
export function stripThinking(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Strip XML-like tags: <think>...</think> or <thought>...</thought>
  cleaned = cleaned.replace(/<(?:think|thought)>[\s\S]*?<\/(?:think|thought)>/gi, "");

  // 2. Strip markdown thinking headers
  if (/Thinking Process:/i.test(cleaned)) {
    // If it's a JSON response, extract the JSON object directly
    const jsonMatch = cleaned.match(/(\{(?:[\s\S]*"rt"[\s\S]*)\})/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    const finalMarker = cleaned.match(
      /(?:Final Answer:|Final version:|\*Refined version:\*|Versão final:)\s*([\s\S]*)/i
    );
    if (finalMarker && finalMarker[1].trim()) {
      cleaned = finalMarker[1];
    } else {
      const paragraphs = cleaned.split(/(?:\r?\n){2,}/);
      const filtered = paragraphs.filter(
        (p) =>
          !/thinking process|analyze the request|draft \d|let's count|well within/i.test(p)
      );
      if (filtered.length > 0) {
        cleaned = filtered.join("\n\n");
      }
    }
  }

  return cleaned.trim();
}

/**
 * Calls OpenRouter using the OpenAI SDK with reasoning enabled.
 */
export async function callLLM(
  messages: any[],
  maxTokens = 2000,
  model = MODELS[0]
): Promise<ORChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Configure a variável de ambiente OPENROUTER_API_KEY."
    );
  }

  try {
    // Call with reasoning: { enabled: true } as required by OpenRouter
    const apiResponse = (await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      reasoning: { enabled: true },
    } as any)) as ORChatCompletion;

    const firstMsg = apiResponse.choices?.[0]?.message;
    if (!firstMsg?.content || firstMsg.content.trim() === "") {
      const reasoningText = (firstMsg as any)?.reasoning || "";
      if (reasoningText && (reasoningText.includes("{") || reasoningText.length > 50)) {
        firstMsg.content = stripThinking(reasoningText);
      } else {
        // Fallback retry without reasoning parameter to get direct content
        const directResponse = (await client.chat.completions.create({
          model,
          messages,
          max_tokens: maxTokens,
        } as any)) as ORChatCompletion;
        if (directResponse.choices?.[0]?.message) {
          directResponse.choices[0].message.content = stripThinking(
            directResponse.choices[0].message.content || ""
          );
        }
        return directResponse;
      }
    } else {
      firstMsg.content = stripThinking(firstMsg.content);
    }

    return apiResponse;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);

    // If the selected model does not support the reasoning parameter, retry without it
    if (errorMsg.toLowerCase().includes("reasoning")) {
      const fallbackResponse = (await client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
      } as any)) as ORChatCompletion;
      return fallbackResponse;
    }

    console.error("OpenRouter API error:", errorMsg);
    throw error;
  }
}

/**
 * Executes an AI operation with automatic retry and model fallback logic.
 */
export async function withRetry<T>(
  fn: (model: string) => Promise<T>,
  retries = 3,
  initialDelay = 2000
): Promise<T> {
  let delay = initialDelay;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    try {
      return await fn(model);
    } catch (error: any) {
      const msg = error?.message || String(error);
      const isRateLimit = msg.includes("429") || msg.includes("quota") || msg.includes("rate limit");
      const isServerUnavailable =
        msg.includes("500") || msg.includes("502") || msg.includes("503") || msg.includes("504");
      const isRetryable = isRateLimit || isServerUnavailable;

      if (attempt < retries && isRetryable) {
        console.warn(
          `[OpenRouter API] Erro temporário (tentativa ${attempt + 1}/${retries}, modelo ${model}): ${msg.substring(0, 150)}... Aguardando ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 10000);
      } else {
        if (isRateLimit) {
          throw new Error(
            "Limite de requisições temporário atingido na API do OpenRouter. Aguarde alguns segundos e tente novamente."
          );
        }
        throw error;
      }
    }
  }
  throw new Error("Tentativas esgotadas ao comunicar com a IA do OpenRouter.");
}
