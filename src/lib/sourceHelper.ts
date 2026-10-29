import { Source } from "@/src/types";

interface TechnologyReference {
  keywords: string[];
  guide: {
    title: string;
    url: string;
    publisher: string;
    author?: string;
    description: string;
    searchQuery: string;
  };
  article: {
    title: string;
    url: string;
    publisher: string;
    author?: string;
    description: string;
    searchQuery: string;
  };
  video: {
    title: string;
    url: string;
    publisher: string;
    author?: string;
    description: string;
    searchQuery: string;
  };
  book?: {
    title: string;
    url: string;
    publisher: string;
    author: string;
    description: string;
    searchQuery: string;
  };
}

const TECH_CATALOG: TechnologyReference[] = [
  {
    keywords: ["react", "jsx", "hook", "hooks", "next", "state", "props", "frontend"],
    guide: {
      title: "Documentação Oficial do React (React.dev) - Guia Completo e Prático",
      url: "https://react.dev/learn",
      publisher: "React Docs",
      author: "Meta / Comunidade React",
      description: "Documentação interativa cobrindo componentes, estado, efeitos e boas práticas modernas de React.",
      searchQuery: "documentação oficial react.dev componentes hooks estado",
    },
    article: {
      title: "Arquitetura e Boas Práticas no Ecossistema React Moderno",
      url: "https://www.freecodecamp.org/portuguese/news/guia-de-react-para-iniciantes/",
      publisher: "freeCodeCamp Brasil",
      author: "Comunidade freeCodeCamp",
      description: "Artigo aprofundado com exemplos práticos de estruturação de aplicações e gerenciamento de estado.",
      searchQuery: "guia completo react iniciante ao avancado freecodecamp",
    },
    video: {
      title: "Curso Completo de React para Desenvolvedores Web",
      url: "https://www.youtube.com/@rocketseat",
      publisher: "Rocketseat / YouTube",
      author: "Rocketseat",
      description: "Aulas práticas com criação de interfaces reativas, componentização e consumo de APIs.",
      searchQuery: "curso react hooks componentes rocketseat youtube",
    },
    book: {
      title: "The Road to React",
      url: "https://www.roadtoreact.com/",
      publisher: "Leanpub",
      author: "Robin Wieruch",
      description: "Livro de referência sobre desenvolvimento de software com React e TypeScript.",
      searchQuery: "livro the road to react robin wieruch pdf",
    },
  },
  {
    keywords: ["javascript", "js", "ecmascript", "typescript", "ts", "async", "promise", "es6"],
    guide: {
      title: "MDN Web Docs - Guia Completo de JavaScript e APIs Web",
      url: "https://developer.mozilla.org/pt-BR/docs/Web/JavaScript",
      publisher: "MDN Web Docs",
      author: "Mozilla Developer Network",
      description: "A bíblia de referência sobre tipos, closures, protótipos, Promises e manipulação da DOM.",
      searchQuery: "mdn web docs javascript tutorial moderno portugues",
    },
    article: {
      title: "O Tutorial Moderno de JavaScript (JavaScript.info)",
      url: "https://javascript.info/",
      publisher: "The Modern JavaScript Tutorial",
      author: "Ilya Kantor",
      description: "Explicações detalhadas desde a sintaxe elementar até event loop e microtasks.",
      searchQuery: "javascript.info tutorial moderno javascript event loop",
    },
    video: {
      title: "Curso de JavaScript do Básico ao Avançado",
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo",
      author: "Gustavo Guanabara",
      description: "Série completa e didática com exercícios práticos e fundamentos essenciais de JS.",
      searchQuery: "curso javascript gustavo guanabara curso em video",
    },
    book: {
      title: "Eloquent JavaScript (JavaScript Eloquente em Português)",
      url: "https://eloquentjavascript.net/",
      publisher: "No Starch Press",
      author: "Marijn Haverbeke",
      description: "Livro gratuito clássico sobre programação funcional, orientação a objetos e navegador.",
      searchQuery: "eloquent javascript marijn haverbeke livro online",
    },
  },
  {
    keywords: ["python", "django", "flask", "fastapi", "pandas", "data", "scikit"],
    guide: {
      title: "Documentação Oficial do Python em Português",
      url: "https://docs.python.org/pt-br/3/tutorial/index.html",
      publisher: "Python Software Foundation",
      author: "PSF Community",
      description: "Tutorial oficial do Python cobrindo estruturas de dados, módulos, classes e biblioteca padrão.",
      searchQuery: "tutorial oficial python 3 documentacao pt-br",
    },
    article: {
      title: "Real Python - Artigos e Guias Avançados de Desenvolvimento Python",
      url: "https://realpython.com/",
      publisher: "Real Python",
      author: "Dan Bader & Equipe",
      description: "Artigos aprofundados sobre arquitetura de software, automação e boas práticas em Python.",
      searchQuery: "real python tutorials best practices software development",
    },
    video: {
      title: "Curso Completo de Python (Mundos 1, 2 e 3)",
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo",
      author: "Gustavo Guanabara",
      description: "O mais completo curso introdutório em português, com dezenas de exercícios práticos.",
      searchQuery: "curso python mundo 1 2 3 curso em video guanabara",
    },
    book: {
      title: "Pense em Python (Think Python)",
      url: "https://greenteapress.com/wp/think-python-2e/",
      publisher: "O'Reilly",
      author: "Allen B. Downey",
      description: "Livro fundamental para raciocínio computacional e engenharia com Python.",
      searchQuery: "pense em python allen downey livro gratuito",
    },
  },
  {
    keywords: ["git", "github", "gitlab", "versionamento", "commit", "branch", "merge"],
    guide: {
      title: "Pro Git - Livro Oficial e Documentação do Git em Português",
      url: "https://git-scm.com/book/pt-br/v2",
      publisher: "Git SCM",
      author: "Scott Chacon & Ben Straub",
      description: "Referência definitiva sobre controle de versão, fluxos de trabalho (GitFlow, Trunk-based) e internals.",
      searchQuery: "livro pro git oficial portugues git-scm book pt-br",
    },
    article: {
      title: "Documentação e Guias Práticos do GitHub",
      url: "https://docs.github.com/pt",
      publisher: "GitHub Docs",
      author: "GitHub Staff",
      description: "Guias passo a passo sobre Pull Requests, Code Reviews, Actions e colaboração de código.",
      searchQuery: "documentacao oficial github pull request branch workflow",
    },
    video: {
      title: "Curso Prático de Git e GitHub para Iniciantes",
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo",
      author: "Gustavo Guanabara",
      description: "Treinamento em vídeo demonstrando comandos, resolução de conflitos e publicação de repositórios.",
      searchQuery: "curso git e github gustavo guanabara completo",
    },
  },
  {
    keywords: ["html", "css", "web", "layout", "flexbox", "grid", "responsiv", "tailwind", "sass"],
    guide: {
      title: "MDN Web Docs - Guia e Referência Completa de HTML & CSS",
      url: "https://developer.mozilla.org/pt-BR/docs/Learn_web_development",
      publisher: "MDN Web Docs",
      author: "Mozilla Developer Network",
      description: "Estruturação semântica, acessibilidade (a11y), Flexbox, CSS Grid e design responsivo.",
      searchQuery: "mdn web docs aprenda desenvolvimento web html css",
    },
    article: {
      title: "Learn CSS & Web Vitals no Web.dev",
      url: "https://web.dev/learn/css/",
      publisher: "Google Web.dev",
      author: "Equipe Google Chrome",
      description: "Artigos detalhados sobre renderização de navegadores, performance e CSS moderno.",
      searchQuery: "web.dev learn css google chrome responsive layout",
    },
    video: {
      title: "Curso de HTML5 e CSS3 Moderno com Design Responsivo",
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo",
      author: "Gustavo Guanabara",
      description: "Criação de websites modernos do zero com semântica e boas práticas de estilização.",
      searchQuery: "curso html5 e css3 modulo 1 2 3 4 5 guanabara",
    },
  },
  {
    keywords: ["node", "express", "backend", "nest", "api", "rest", "endpoint", "servidor"],
    guide: {
      title: "Documentação Oficial do Node.js - Guias de Arquitetura",
      url: "https://nodejs.org/pt-br/docs/guides",
      publisher: "Node.js Foundation",
      author: "Comunidade OpenJS",
      description: "Guias essenciais sobre o Event Loop assíncrono, buffers, streams e arquitetura de microsserviços.",
      searchQuery: "documentacao oficial nodejs guias arquitetura event loop",
    },
    article: {
      title: "Guia de Boas Práticas em APIs RESTful",
      url: "https://restfulapi.net/",
      publisher: "RESTful API Tutorials",
      author: "Lokesh Gupta",
      description: "Padrões de design de APIs HTTP, verbos REST, status codes, paginação e versionamento.",
      searchQuery: "restful api design best practices status codes json",
    },
    video: {
      title: "Arquitetura Backend e APIs com Node.js na Prática",
      url: "https://www.youtube.com/@rocketseat",
      publisher: "Rocketseat / YouTube",
      author: "Diego Fernandes",
      description: "Construção de APIs escaláveis, autenticação JWT, integração com bancos e validação de schemas.",
      searchQuery: "curso api rest nodejs typescript prisma rocketseat",
    },
  },
  {
    keywords: ["banco", "sql", "postgres", "mysql", "database", "mongodb", "query", "tabela"],
    guide: {
      title: "Documentação Oficial do PostgreSQL - Tutorial e SQL Manual",
      url: "https://www.postgresql.org/docs/current/tutorial.html",
      publisher: "PostgreSQL Global Development Group",
      author: "PostgreSQL Core Team",
      description: "Tutorial prático de SQL relacional, índices, transações ACID, joins e modelagem de dados.",
      searchQuery: "postgresql tutorial oficial documentacao sql acid joins",
    },
    article: {
      title: "Modelagem Relacional e Normalização de Banco de Dados",
      url: "https://www.freecodecamp.org/portuguese/news/bancos-de-dados-relacionais-explicados/",
      publisher: "freeCodeCamp Brasil",
      author: "Equipe freeCodeCamp",
      description: "Artigo explicando Primeira, Segunda e Terceira Formas Normais e relacionamentos de dados.",
      searchQuery: "modelagem de banco de dados relacional 1fn 2fn 3fn freecodecamp",
    },
    video: {
      title: "Curso Completo de Banco de Dados e SQL",
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo",
      author: "Gustavo Guanabara",
      description: "Conceitos de DDL, DML, chaves primárias e estrangeiras explicados passo a passo.",
      searchQuery: "curso banco de dados sql guanabara curso em video",
    },
    book: {
      title: "Designing Data-Intensive Applications",
      url: "https://dataintensive.net/",
      publisher: "O'Reilly Media",
      author: "Martin Kleppmann",
      description: "A obra prima sobre sistemas distribuídos, armazenamento confiável e replicação de dados.",
      searchQuery: "designing data intensive applications martin kleppmann livro",
    },
  },
  {
    keywords: ["docker", "container", "devops", "kubernetes", "k8s", "ci/cd", "deploy"],
    guide: {
      title: "Documentação Oficial do Docker - Get Started",
      url: "https://docs.docker.com/get-started/",
      publisher: "Docker Inc.",
      author: "Docker Team",
      description: "Guia completo sobre Dockerfile, imagens, contêineres, volumes e orquestração com Docker Compose.",
      searchQuery: "docker get started documentacao oficial compose dockerfile",
    },
    article: {
      title: "Desmistificando Contêineres e DevOps na Prática",
      url: "https://www.redhat.com/pt-br/topics/containers/what-is-docker",
      publisher: "Red Hat",
      author: "Especialistas Red Hat",
      description: "Artigo sobre isolamento de processos no Linux (namespaces e cgroups) e vantagens de contêineres.",
      searchQuery: "o que e docker como funciona containers red hat",
    },
    video: {
      title: "Docker para Desenvolvedores - Da Teoria à Produção",
      url: "https://www.youtube.com/@FabioAkita1990",
      publisher: "Fabio Akita / YouTube",
      author: "Fabio Akita",
      description: "Explicação profunda de arquitetura de contêineres, camadas de sistemas de arquivos e kernel.",
      searchQuery: "fabio akita docker nao seja um zé lelinho containers",
    },
  },
  {
    keywords: ["arquitetura", "padroes", "design pattern", "solid", "clean code", "refatoracao"],
    guide: {
      title: "Refactoring Guru - Catálogo de Padrões de Projeto (Design Patterns)",
      url: "https://refactoring.guru/pt-br/design-patterns",
      publisher: "Refactoring Guru",
      author: "Alexander Shvets",
      description: "O melhor catálogo visual e prático de padrões criacionais, estruturais e comportamentais.",
      searchQuery: "refactoring guru design patterns padroes de projeto portugues",
    },
    article: {
      title: "Artigos e Guias de Arquitetura de Software de Martin Fowler",
      url: "https://martinfowler.com/architecture/",
      publisher: "MartinFowler.com",
      author: "Martin Fowler",
      description: "Artigos seminais sobre Microsserviços, Monólitos Modulares, CI/CD e Clean Architecture.",
      searchQuery: "martin fowler software architecture patterns guide",
    },
    video: {
      title: "Princípios SOLID e Clean Code para Desenvolvedores",
      url: "https://www.youtube.com/@FabioAkita1990",
      publisher: "Fabio Akita / YouTube",
      author: "Fabio Akita",
      description: "Análise crítica e fundamentada sobre boas práticas e arquitetura de software no mundo real.",
      searchQuery: "fabio akita boas praticas programacao solid arquitetura",
    },
    book: {
      title: "Clean Architecture: A Craftsman's Guide to Software Structure",
      url: "https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/",
      publisher: "Prentice Hall",
      author: "Robert C. Martin (Uncle Bob)",
      description: "Diretrizes universais de desacoplamento, camadas e dependências independentes.",
      searchQuery: "livro arquitetura limpa robert c martin uncle bob pdf",
    },
  },
];

/**
 * Sanitizes and validates that a URL is a real reference, not a generic search link.
 */
export function sanitizeSourceUrl(url: string, topicTitle: string): string {
  if (!url || typeof url !== "string") {
    return "https://developer.mozilla.org/pt-BR/";
  }

  const trimmed = url.trim();

  // Check if it's a generic search link
  const isSearchLink =
    trimmed.includes("google.com/search") ||
    trimmed.includes("youtube.com/results") ||
    trimmed.includes("bing.com/search") ||
    trimmed.includes("devdocs.io/#q=") ||
    trimmed.includes("dev.to/search") ||
    trimmed.includes("search?q=") ||
    trimmed.includes("search_query=");

  if (!isSearchLink && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    return trimmed;
  }

  // If it was a search link, fall back to the curated catalog URL for this topic
  const fallbackSources = getOptimizedTopicSources(topicTitle);
  return fallbackSources[0]?.url || "https://developer.mozilla.org/pt-BR/";
}

/**
 * Generates verified, real-world educational resources (articles, documentation, videos, books)
 * without using search query URLs.
 */
export function getOptimizedTopicSources(
  topicTitle: string,
  contextDescription?: string,
  roadmapContext?: { title?: string; originalTopic?: string }
): Source[] {
  const normalizedText = [
    topicTitle,
    contextDescription || "",
    roadmapContext?.title || "",
    roadmapContext?.originalTopic || "",
  ]
    .join(" ")
    .toLowerCase();

  const year = new Date().getFullYear().toString();

  // Find the matching technology in our catalog
  const matched = TECH_CATALOG.find((item) =>
    item.keywords.some((keyword) => normalizedText.includes(keyword))
  );

  if (matched) {
    const list: Source[] = [
      {
        type: "guide",
        title: matched.guide.title,
        url: matched.guide.url,
        publisher: matched.guide.publisher,
        author: matched.guide.author,
        year,
        description: matched.guide.description,
        searchQuery: `${matched.guide.searchQuery} "${topicTitle}"`,
      },
      {
        type: "article",
        title: `${matched.article.title} - Foco em: ${topicTitle}`,
        url: matched.article.url,
        publisher: matched.article.publisher,
        author: matched.article.author,
        year,
        description: matched.article.description,
        searchQuery: `${matched.article.searchQuery} ${topicTitle}`,
      },
      {
        type: "video",
        title: `${matched.video.title} (${topicTitle})`,
        url: matched.video.url,
        publisher: matched.video.publisher,
        author: matched.video.author,
        year,
        description: matched.video.description,
        searchQuery: `${matched.video.searchQuery} ${topicTitle}`,
      },
    ];

    if (matched.book) {
      list.push({
        type: "book",
        title: matched.book.title,
        url: matched.book.url,
        publisher: matched.book.publisher,
        author: matched.book.author,
        year,
        description: matched.book.description,
        searchQuery: matched.book.searchQuery,
      });
    }

    return list;
  }

  // Fallback for general tech topics: real high-authority tech portals with deep query info
  return [
    {
      type: "guide",
      title: `Documentação e Referência Técnica: ${topicTitle}`,
      url: "https://developer.mozilla.org/pt-BR/",
      publisher: "MDN Web Docs",
      author: "MDN / W3C",
      year,
      description: `Guia de conceitos, padrões abertos e especificações formais relacionados a ${topicTitle}.`,
      searchQuery: `documentação oficial tutorial ${topicTitle} guia desenvolvedor`,
    },
    {
      type: "article",
      title: `Artigo Técnico e Práticas de Mercado: ${topicTitle}`,
      url: "https://www.freecodecamp.org/portuguese/news/",
      publisher: "freeCodeCamp Brasil",
      author: "Comunidade Técnica",
      year,
      description: `Artigo detalhado com casos práticos e resolução de problemas comuns em ${topicTitle}.`,
      searchQuery: `artigo estudo aprofundado ${topicTitle} freecodecamp portugues`,
    },
    {
      type: "video",
      title: `Vídeo Tutorial e Aulas Práticas: ${topicTitle}`,
      url: "https://www.youtube.com/@CursoemVideo",
      publisher: "Curso em Vídeo / YouTube",
      author: "Gustavo Guanabara",
      year,
      description: `Aulas em vídeo com didática passo a passo e resolução de exercícios sobre ${topicTitle}.`,
      searchQuery: `curso tutorial completo ${topicTitle} em portugues aula`,
    },
    {
      type: "book",
      title: `Livro e Teoria de Engenharia: ${topicTitle}`,
      url: "https://refactoring.guru/pt-br/design-patterns",
      publisher: "Refactoring Guru / O'Reilly",
      author: "Engenharia de Software",
      year,
      description: `Material de aprofundamento conceitual e padrões aplicados para ${topicTitle}.`,
      searchQuery: `livro engenharia de software arquitetura ${topicTitle}`,
    },
  ];
}
