import { RoadmapMode, Source, Challenge } from "../types";

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

async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Falha na conexão com o servidor. Verifique sua rede e tente novamente.");
  }

  const rawText = await res.text();
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let errorMsg = `Erro no processamento (${res.status}). Tente novamente em instantes.`;
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

// Backward compatibility alias for single-call invocation
export async function decomposeTopic(enhancedPrompt: string, originalTopic?: string): Promise<TopicTree> {
  const data = await apiPost<{ topicTree: TopicTree }>("/api/gemini/decompose-topic", {
    enhancedPrompt,
    originalTopic: originalTopic || enhancedPrompt,
  });
  return data.topicTree;
}

export async function curateContent(
  topicTitle: string, 
  mode: RoadmapMode,
  roadmapContext?: { title: string; originalTopic: string }
): Promise<{ content?: string; sources: Source[] }> {
  return await apiPost<{ content?: string; sources: Source[] }>("/api/gemini/curate-content", {
    topicTitle,
    mode,
    roadmapContext,
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
