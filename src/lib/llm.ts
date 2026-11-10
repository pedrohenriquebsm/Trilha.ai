import OpenAI from "openai";
import { ApiError } from "./apiError";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://trilha.ai";

export const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "missing-key",
  defaultHeaders: {
    "HTTP-Referer": APP_URL,
    "X-Title": "Trilha.ai",
  },
});

/**
 * `openrouter/free` é o roteador de modelos gratuitos do OpenRouter e era o
 * modelo usado anteriormente. Ele escolhe um provedor disponível, evitando
 * fixar um modelo `:free` específico que pode responder 429.
 *
 * O fallback também usa o roteador: se `OPENROUTER_MODEL` apontar para um
 * modelo específico temporariamente limitado, a próxima tentativa volta para
 * um modelo gratuito disponível.
 */
export const MODELS = Array.from(
  new Set(
    [
      process.env.OPENROUTER_MODEL || "openrouter/free",
      "openrouter/free",
    ].filter(Boolean)
  )
);

/** Default per-request timeout. Keeps AI Studio / Cloud Run requests bounded. */
export const DEFAULT_LLM_TIMEOUT_MS = 60_000;

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

// Specialized Agent Prompts - Sequential Context-Aware Architecture
export const AGENT_1_PROMPT_OPTIMIZER = `Você é um Agente Especialista em Engenharia de Prompts Educacionais.
Sua única responsabilidade é receber o tópico do usuário e criar um escopo técnico preciso, detalhado e delimitado que servirá de base para toda a criação da trilha.
REGRAS:
- Mantenha estrito foco no tema central do usuário.
- Defina o nível de profundidade e as competências esperadas.
- Retorne apenas o escopo em português, direto e sem saudações.`;

export const AGENT_2_LEVEL_GENERATOR = `Você é um Arquiteto Curricular. Sua responsabilidade é gerar tópicos para um nível específico da trilha de aprendizado.
NÍVEIS: (1. Fundamentals, 2. Beginner, 3. Intermediate, 4. Advanced, 5. Next Steps).
CONTEXTO ANTERIOR: {contexto_anterior}
TEMA E ESCOPO: {escopo}
NÍVEL ATUAL PARA GERAR: {nivel_atual}

REGRAS:
- Gere de 3 a 6 tópicos técnicos densos para este nível.
- Para cada tópico, retorne: "Título: Descrição (20 palavras)".
- Não gere explicações automáticas, apenas a lista.`;

export const AGENT_3_TOPIC_OVERVIEW = `Você é um Especialista em Conteúdo Técnico.
Sua responsabilidade é criar uma visão geral densa e direta para cada tópico gerado nos níveis anteriores.
LISTA DE TÓPICOS: {lista_topicos}

REGRAS:
- Para cada tópico, escreva um parágrafo objetivo de 3 a 5 frases explicando o que é, por que é importante e o conceito chave.
- Mantenha foco técnico e utilitário.
- Não gere introduções ou conclusões, apenas a lista de visões gerais.`;

export const AGENT_4_JSON_FORMATTER = `Você é um Agente Especialista em Estruturação JSON.
Sua única responsabilidade é transformar os tópicos e visões gerais fornecidas em um JSON estritamente válido e bem formado.

FORMATO:
{
  "rt": "Título da Trilha",
  "lv": {
    "PREREQUISITES": [{"t": "Título", "d": "Descrição", "o": 1, "s": ["Termo"]}],
    "BEGINNER": [{"t": "Título", "d": "Descrição", "o": 1, "s": ["Termo"]}],
    "INTERMEDIATE": [{"t": "...", "d": "...", "o": 1, "s": ["..."]}],
    "ADVANCED": [{"t": "...", "d": "...", "o": 1, "s": ["..."]}],
    "NEXT_STEPS": [{"t": "...", "d": "...", "o": 1, "s": ["..."]}]
  }
}

REGRAS ESTRICTAS:
1. Retorne APENAS o JSON puro. Não escreva NADA antes ou depois do JSON.
2. Não utilize blocos de código Markdown (\`\`\`json ... \`\`\`).
3. Utilize aspas duplas (") para chaves e valores string.
4. Certifique-se de que não haja vírgulas após o último elemento de arrays ou objetos.
5. Garanta que todos os tópicos fornecidos estejam presentes.`;

// Aliases for backwards compatibility
export const PROMPT_ENHANCER_SYSTEM_PROMPT = AGENT_1_PROMPT_OPTIMIZER;
export const TOPIC_DECOMPOSER_SYSTEM_PROMPT = AGENT_4_JSON_FORMATTER;
export const AGENT_2_CURRICULUM_ARCHITECT = AGENT_2_LEVEL_GENERATOR;
export const AGENT_3_REFERENCES_CURATOR = AGENT_3_TOPIC_OVERVIEW;
export const AGENT_4_ROADMAP_SERIALIZER = AGENT_4_JSON_FORMATTER;


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
  model = MODELS[0],
  timeoutMs = DEFAULT_LLM_TIMEOUT_MS
): Promise<ORChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Configure a variável de ambiente OPENROUTER_API_KEY."
    );
  }

  try {
    // Call with reasoning: { enabled: true } as required by OpenRouter.
    // maxRetries: 0 keeps retry/fallback logic in withRetry().
    const apiResponse = (await client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      reasoning: { enabled: true },
      timeout: timeoutMs,
      maxRetries: 0,
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
          timeout: timeoutMs,
          maxRetries: 0,
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
        timeout: timeoutMs,
        maxRetries: 0,
      } as any)) as ORChatCompletion;
      return fallbackResponse;
    }

    console.error(`OpenRouter API error (${model}):`, errorMsg);
    throw error;
  }
}

/**
 * Errors that should switch to the next model/attempt.
 * Auth and malformed-request errors will not improve by retrying.
 */
function isRetryableError(message: string): boolean {
  const msg = message.toLowerCase();

  if (
    /\b(401|403)\b/.test(msg) ||
    msg.includes("invalid api key") ||
    msg.includes("unauthorized") ||
    msg.includes("no auth credentials")
  ) {
    return false;
  }

  if (
    /\b(400|422)\b/.test(msg) &&
    !msg.includes("model") &&
    !msg.includes("empty") &&
    !msg.includes("vazia")
  ) {
    return false;
  }

  return true;
}

function friendlyError(message: string, isLastAttempt: boolean): Error {
  const msg = message.toLowerCase();

  if (
    /\b(401|403)\b/.test(msg) ||
    msg.includes("invalid api key") ||
    msg.includes("unauthorized") ||
    msg.includes("no auth credentials")
  ) {
    return new ApiError(
      503,
      "A chave OPENROUTER_API_KEY foi recusada pelo provedor. Verifique a configuração no servidor."
    );
  }

  if (
    msg.includes("404") ||
    msg.includes("not found") ||
    msg.includes("no endpoints") ||
    msg.includes("not a valid model") ||
    msg.includes("unavailable")
  ) {
    return new ApiError(
      503,
      "Nenhum modelo de IA gratuito está disponível no momento. Tente novamente em alguns instantes."
    );
  }

  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("quota")) {
    return new ApiError(
      429,
      "Limite temporário de uso da IA atingido. Aguarde alguns segundos e tente novamente."
    );
  }

  if (
    isLastAttempt &&
    (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted"))
  ) {
    return new ApiError(
      504,
      "A IA demorou demais para responder. Tente novamente com um tema mais específico."
    );
  }

  if (msg.includes("openrouter_api_key")) {
    return new ApiError(
      503,
      "A chave OPENROUTER_API_KEY não está configurada no servidor."
    );
  }

  if (message.startsWith("A IA") || message.startsWith("Não foi possível")) {
    return new ApiError(502, message);
  }

  return new ApiError(502, "A IA retornou uma resposta inválida. Tente novamente.");
}

/**
 * Executes an AI operation with automatic model fallback and retry logic.
 * Model rotation also happens on model-not-found errors, not only on 429/5xx.
 */
export async function withRetry<T>(
  fn: (model: string) => Promise<T>,
  retries = 2,
  initialDelay = 1500
): Promise<T> {
  let delay = initialDelay;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    try {
      return await fn(model);
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const message = lastError.message || String(error);

      if (attempt < retries && isRetryableError(message)) {
        console.warn(
          `[OpenRouter] Tentativa ${attempt + 1}/${retries + 1} falhou (${model}): ${message.substring(
            0,
            180
          )}. Aguardando ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 8000);
        continue;
      }

      throw friendlyError(message, true);
    }
  }

  throw friendlyError(lastError?.message || "Falha ao comunicar com a IA.", true);
}
