import { RoadmapMode, Source, Challenge } from "../types";
import { auth } from "../lib/firebase";

export interface TopicTree {
  roadmapTitle: string;
  levels: {
    PREREQUISITES: any[];
    BEGINNER: any[];
    INTERMEDIATE: any[];
    ADVANCED: any[];
    NEXT_STEPS: any[];
  };
}

const CLIENT_TIMEOUT_MS = 200_000;

async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Entre na sua conta para usar os recursos de IA.");
  }

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A geração demorou demais para responder. Tente novamente.");
    }
    throw new Error("Falha na conexão com o servidor. Verifique sua rede e tente novamente.");
  } finally {
    clearTimeout(timeoutId);
  }

  const rawText = await res.text();

  if (!res.ok) {
    let errorMsg =
      res.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : res.status === 402
        ? "Você não tem créditos suficientes para esta ação."
        : res.status === 429
        ? "Muitas requisições em pouco tempo. Aguarde alguns segundos."
        : `Erro no processamento (${res.status}). Tente novamente em instantes.`;

    if (rawText) {
      try {
        const data = JSON.parse(rawText);
        if (data && data.error) {
          errorMsg = data.error;
        }
      } catch {
        if (!rawText.includes("<html") && !rawText.includes("<!DOCTYPE") && rawText.length < 150) {
          errorMsg = rawText;
        }
      }
    }
    throw new Error(errorMsg);
  }

  if (!rawText || rawText.trim() === "") {
    throw new Error("O servidor retornou uma resposta vazia. Tente novamente.");
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (parseError) {
    console.error(`Invalid JSON received from ${endpoint}:`, rawText.substring(0, 300), parseError);
    throw new Error("A IA retornou um formato inesperado. Por favor, tente novamente.");
  }
}

// Agent 1: Otimizador de Prompt
export async function enhancePrompt(input: string): Promise<string> {
  try {
    const data = await apiPost<{ enhanced: string }>("/api/gemini/enhance-prompt", { input });
    return data.enhanced || input;
  } catch (err) {
    console.warn("enhancePrompt failed, using raw input:", err);
    return input;
  }
}

// Agent 2: Arquiteto Curricular (Gera lista de tópicos e descrições nos 5 níveis)
export async function listTopics(topic: string, enhancedPrompt: string): Promise<string> {
  const data = await apiPost<{ topicListText: string }>("/api/gemini/list-topics", {
    topic,
    enhancedPrompt,
  });
  return data.topicListText;
}

// Agent 3: Curador de Referências e Fontes Oficiais
export async function curateReferences(topic: string, topicListText: string): Promise<string> {
  const data = await apiPost<{ referencesText: string }>("/api/gemini/curate-references", {
    topic,
    topicListText,
  });
  return data.referencesText;
}

// Agent 4: Serializador TOON JSON
export async function structureRoadmap(
  topic: string,
  topicListText: string,
  referencesText: string
): Promise<TopicTree> {
  const data = await apiPost<{ topicTree: TopicTree }>("/api/gemini/structure-roadmap", {
    topic,
    topicListText,
    referencesText,
  });
  return data.topicTree;
}

export async function curateContent(
  topicTitle: string,
  mode: RoadmapMode,
  roadmapContext?: { title: string; originalTopic: string },
  options?: { forceContent?: boolean; userDescription?: string }
): Promise<{ content?: string; sources: Source[] }> {
  return await apiPost<{ content?: string; sources: Source[] }>("/api/gemini/curate-content", {
    topicTitle,
    mode,
    roadmapContext,
    forceContent: options?.forceContent ?? false,
    userDescription: options?.userDescription,
  });
}

export async function generateChallenge(topicTitle: string, topicContent: string): Promise<Challenge> {
  return await apiPost<Challenge>("/api/gemini/generate-challenge", { topicTitle, topicContent });
}

export async function generateTopicContentAndSources(
  topicTitle: string, 
  userDescription: string, 
  roadmapContext: { title: string, originalTopic: string },
  shouldGenerateContent: boolean
): Promise<{ content?: string; sources: Source[] }> {
  return await apiPost<{ content?: string; sources: Source[] }>("/api/gemini/topic-content-and-sources", {
    topicTitle,
    userDescription,
    roadmapContext,
    shouldGenerateContent,
  });
}
