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

/**
 * Models pinned per role. Pinning is a prerequisite for prompt caching and for
 * reproducible evaluation; when unset, the free router keeps the old behavior.
 */
export const MODEL_ROLES = {
  curriculum: process.env.OPENROUTER_MODEL_CURRICULUM || MODELS[0],
  content: process.env.OPENROUTER_MODEL_CONTENT || MODELS[0],
};

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

/**
 * Single-call curriculum agent. Replaces the old `list-topics` + `structure-roadmap`
 * pair: the model emits the final compact TOON payload directly, so topics are
 * never paid for twice and there is no second chance to drift from the theme.
 */
export const AGENT_CURRICULUM = `Você é um arquiteto curricular técnico.
Decomponha o tema em EXATAMENTE 8 tópicos por nível (40 no total).

Níveis (lv): 0 pré-requisitos, 1 iniciante, 2 intermediário, 3 avançado, 4 próximos passos.

Retorne UM único bloco \`\`\`toon\`\`\` e nada fora dele:
title: Título da trilha em português
topics[40]{lv|t|d|s}:
  0|Modelagem relacional|Tabelas chaves e normalização|sql modelagem
  0|Álgebra relacional|Operações de conjunto sobre tabelas|sql teoria

REGRAS:
- Exatamente 40 linhas. Nunca use reticências nem omita linhas.
- t: 4 a 60 caracteres, específico e único.
- d: no máximo 12 palavras, telegráfico, sem "aprender", "introdução a" ou "conceitos de".
- s: 2 termos de busca separados por espaço.
- Nunca use "|" dentro de um campo.
- Fique estritamente no tema. Não invente produtos, cursos ou tecnologias.
- Sem saudações, sem explicações antes ou depois do bloco.`;

export function buildCurriculumUserPrompt(topic: string, scope?: string): string {
  const cleanTopic = topic.trim().slice(0, 200);
  const cleanScope = (scope || "").trim().slice(0, 800);
  const scopeLine =
    cleanScope && cleanScope.toLowerCase() !== cleanTopic.toLowerCase()
      ? `\nEscopo: ${cleanScope}`
      : "";

  return `Tema: "${cleanTopic}"${scopeLine}\n\nGere a grade com 40 tópicos (8 por nível), fiéis ao tema.`;
}


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

export interface CallLLMOptions {
  /** Send `reasoning: { enabled: true }`. Defaults to true (legacy behavior). */
  reasoning?: boolean;
  temperature?: number;
  /** OpenRouter `response_format`, e.g. `{ type: "json_object" }`. */
  responseFormat?: Record<string, unknown>;
  /** Extra provider preferences, e.g. `{ require_parameters: true }`. */
  provider?: Record<string, unknown>;
}

/**
 * Calls OpenRouter using the OpenAI SDK.
 *
 * `reasoning` is opt-in per call: reasoning tokens are billed as output, so
 * structured/curriculum tasks run without it (which also removes the empty
 * `content` responses that used to require a second request).
 */
export async function callLLM(
  messages: any[],
  maxTokens = 2000,
  model = MODELS[0],
  timeoutMs = DEFAULT_LLM_TIMEOUT_MS,
  options: CallLLMOptions = {}
): Promise<ORChatCompletion> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Configure a variável de ambiente OPENROUTER_API_KEY."
    );
  }

  const reasoningEnabled = options.reasoning !== false;

  const buildRequest = (withReasoning: boolean) => {
    const request: Record<string, unknown> = {
      model,
      messages,
      max_tokens: maxTokens,
      timeout: timeoutMs,
      maxRetries: 0,
    };

    if (withReasoning) request.reasoning = { enabled: true };
    if (typeof options.temperature === "number") request.temperature = options.temperature;
    if (options.responseFormat) request.response_format = options.responseFormat;
    if (options.provider) request.provider = options.provider;

    return request;
  };

  try {
    // maxRetries: 0 keeps retry/fallback logic in withRetry().
    const apiResponse = (await client.chat.completions.create(
      buildRequest(reasoningEnabled) as any
    )) as ORChatCompletion;

    const firstMsg = apiResponse.choices?.[0]?.message;
    if (process.env.LLM_USAGE_LOG === "1") {
      const usage = apiResponse.usage as
        | (typeof apiResponse.usage & {
            prompt_tokens_details?: { cached_tokens?: number };
          })
        | undefined;
      console.info(
        `[llm] ${model} prompt=${usage?.prompt_tokens ?? "?"} completion=${
          usage?.completion_tokens ?? "?"
        } cached=${usage?.prompt_tokens_details?.cached_tokens ?? 0}`
      );
    }

    if (!firstMsg?.content || firstMsg.content.trim() === "") {
      const reasoningText = (firstMsg as any)?.reasoning || "";
      if (reasoningText && (reasoningText.includes("{") || reasoningText.length > 50)) {
        firstMsg.content = stripThinking(reasoningText);
      } else if (reasoningEnabled) {
        // Fallback retry without reasoning parameter to get direct content
        const directResponse = (await client.chat.completions.create(
          buildRequest(false) as any
        )) as ORChatCompletion;
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
    if (reasoningEnabled && errorMsg.toLowerCase().includes("reasoning")) {
      const fallbackResponse = (await client.chat.completions.create(
        buildRequest(false) as any
      )) as ORChatCompletion;
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
  initialDelay = 1500,
  models: string[] = MODELS
): Promise<T> {
  const rotation = models.length > 0 ? models : MODELS;
  let delay = initialDelay;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const model = rotation[attempt % rotation.length];
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
