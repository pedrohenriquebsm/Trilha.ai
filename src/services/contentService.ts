import { callLLM, CONTENT_CURATOR_SYSTEM_PROMPT, withRetry } from "@/src/lib/llm";
import { getOptimizedTopicSources, sanitizeSourceUrl } from "@/src/lib/sourceHelper";
import { Source } from "@/src/types";

export interface CuratedTopicResult {
  content?: string;
  sources: Source[];
}

export interface CurateTopicOptions {
  topicTitle: string;
  shouldGenerateContent: boolean;
  contextDescription?: string;
  roadmapContext?: { title?: string; originalTopic?: string };
}

const SOURCES_PROMPT_ADDENDUM = `
Além da explicação, ao final da resposta inclua um bloco com fontes e referências REAIS e específicas no seguinte formato:
\`\`\`sources-json
[
  {
    "type": "guide",
    "title": "Nome exato da documentação ou guia oficial",
    "url": "https://url-real-do-site-ou-documentacao (NUNCA coloque links de busca do Google ou YouTube)",
    "publisher": "Nome da organização ou portal (ex: MDN, React.dev, Python.org)",
    "author": "Autor ou mantenedor oficial",
    "description": "Explicação objetiva sobre o que este material aborda e como focar os estudos",
    "searchQuery": "Termos de busca recomendados para o estudante pesquisar artigos científicos e referências adicionais"
  },
  {
    "type": "article",
    "title": "Título de artigo técnico ou tutorial detalhado",
    "url": "https://url-real-de-artigo-ou-portal (ex: freeCodeCamp, Dev.to, Web.dev)",
    "publisher": "Portal publicador",
    "description": "O que o artigo detalha na prática",
    "searchQuery": "Termos de busca específicos para encontrar mais artigos desse tópico"
  },
  {
    "type": "video",
    "title": "Título de curso em vídeo, canal ou aula prática recomendada",
    "url": "https://url-real-de-canal-ou-plataforma-de-video (ex: https://www.youtube.com/@CursoemVideo ou @rocketseat)",
    "publisher": "Canal ou plataforma",
    "author": "Nome do instrutor ou canal",
    "description": "Conteúdo e metodologia apresentados nas aulas em vídeo",
    "searchQuery": "Termos exatos para pesquisar vídeos e tutoriais práticos no YouTube"
  }
]
\`\`\`
Regras Absolutas para as fontes:
- NUNCA retorne links de pesquisa (ex: google.com/search, youtube.com/results, devdocs.io/#q=, search?q=).
- Forneça URLs reais de documentações oficiais, portais de artigos consagrados ou canais de aula.
- Cada fonte DEVE ter título, descrição do conteúdo e termos precisos em 'searchQuery' para guiar a pesquisa aprofundada.`;

/**
 * Service orchestrating AI explanation generation and authentic, verified source curation.
 */
export async function curateTopicService({
  topicTitle,
  shouldGenerateContent,
  contextDescription,
  roadmapContext,
}: CurateTopicOptions): Promise<CuratedTopicResult> {
  const fallbackSources = getOptimizedTopicSources(topicTitle, contextDescription, roadmapContext);
  let content: string | undefined = undefined;
  let sources: Source[] = fallbackSources;

  if (shouldGenerateContent) {
    const result = await withRetry(async (model) => {
      const roadmapInfo = roadmapContext?.title
        ? ` (Trilha: "${roadmapContext.title}", Foco: "${roadmapContext.originalTopic || ""}")`
        : "";

      const prompt = contextDescription
        ? `Tópico: "${topicTitle}"${roadmapInfo}. Contexto: "${contextDescription.substring(0, 150)}". Explique concisamente com subtópicos específicos de estudo e fontes reais recomendadas.`
        : `Tópico: "${topicTitle}"${roadmapInfo}. Explique concisamente com subtópicos específicos de estudo e fontes reais recomendadas.`;

      const response = await callLLM(
        [
          {
            role: "system",
            content: `${CONTENT_CURATOR_SYSTEM_PROMPT}\n${SOURCES_PROMPT_ADDENDUM}`,
          },
          { role: "user", content: prompt },
        ],
        2500,
        model
      );

      const rawText = response.choices?.[0]?.message?.content?.trim() || "";
      if (!rawText) {
        return {
          content: "Conteúdo não disponível no momento.",
          sources: fallbackSources,
        };
      }

      // Extract sources JSON if present in ```sources-json ... ```
      let parsedAiSources: Source[] = [];
      const sourcesMatch = rawText.match(/```(?:sources-json|json:sources|sources)\s*([\s\S]*?)\s*```/i);
      if (sourcesMatch) {
        try {
          const parsed = JSON.parse(sourcesMatch[1].trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedAiSources = parsed.map((item: any) => ({
              type: ["book", "article", "video", "guide"].includes(item.type)
                ? item.type
                : "guide",
              title: item.title ? String(item.title) : `Referência: ${topicTitle}`,
              url: sanitizeSourceUrl(String(item.url || ""), topicTitle),
              publisher: item.publisher ? String(item.publisher) : undefined,
              author: item.author ? String(item.author) : undefined,
              year: item.year ? String(item.year) : new Date().getFullYear().toString(),
              description: item.description ? String(item.description) : undefined,
              searchQuery: item.searchQuery ? String(item.searchQuery) : `pesquisa ${topicTitle} documentação artigo`,
            }));
          }
        } catch (e) {
          console.warn("Failed to parse sources-json from AI, using verified catalog", e);
        }
      }

      // Remove the sources-json block from the markdown explanation so the user only sees clean Markdown
      const cleanMarkdown = rawText
        .replace(/```(?:sources-json|json:sources|sources)[\s\S]*?```/gi, "")
        .trim();

      // Combine AI sources with fallback catalog to ensure high quality and complete coverage
      const finalSources = parsedAiSources.length > 0 ? parsedAiSources : fallbackSources;

      return {
        content: cleanMarkdown || "Conteúdo não disponível.",
        sources: finalSources,
      };
    });

    content = result.content;
    sources = result.sources;
  }

  return {
    content,
    sources,
  };
}
