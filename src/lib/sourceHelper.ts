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
    keywords: ["react", "jsx", "hook", "hooks", "next.js", "nextjs", "state", "props", "frontend"],
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
    keywords: ["python", "django", "flask", "fastapi", "pytest", "pip"],
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
  {
    keywords: ["rust", "cargo", "borrow checker", "ownership", "tokio", "rustlang"],
    guide: {
      title: "The Rust Programming Language — Livro Oficial",
      url: "https://doc.rust-lang.org/book/",
      publisher: "Rust Project",
      author: "Steve Klabnik & Carol Nichols",
      description: "Guia oficial de ownership, borrowing, lifetimes, traits, concorrência e testes em Rust.",
      searchQuery: "the rust programming language book oficial português",
    },
    article: {
      title: "Rust by Example — Exemplos Executáveis",
      url: "https://doc.rust-lang.org/rust-by-example/",
      publisher: "Rust Project",
      author: "Rust Community",
      description: "Coleção de exemplos executáveis cobrindo desde sintaxe básica até macros e async.",
      searchQuery: "rust by example exemplos executaveis",
    },
    video: {
      title: "Canal Oficial da Rust Foundation",
      url: "https://www.youtube.com/@rustfoundation",
      publisher: "Rust Foundation / YouTube",
      author: "Rust Foundation",
      description: "Palestras, updates da linguagem e conteúdo oficial sobre o ecossistema Rust.",
      searchQuery: "rust foundation youtube palestras rust",
    },
  },
  {
    keywords: ["java", "spring boot", "spring", "jvm", "maven", "gradle"],
    guide: {
      title: "Documentação Oficial da Plataforma Java",
      url: "https://docs.oracle.com/en/java/",
      publisher: "Oracle",
      author: "Oracle Java Team",
      description: "Documentação oficial da linguagem, JVM, bibliotecas padrão e guias de migração.",
      searchQuery: "documentacao oficial java oracle jvm",
    },
    article: {
      title: "Baeldung — Tutoriais de Java e Spring",
      url: "https://www.baeldung.com/",
      publisher: "Baeldung",
      author: "Baeldung Team",
      description: "Tutoriais práticos de Java, Spring Boot, JPA, testes e arquitetura de aplicações.",
      searchQuery: "baeldung java spring boot tutoriais",
    },
    video: {
      title: "Loiane Groner — Java e Spring na Prática",
      url: "https://www.youtube.com/@loiane",
      publisher: "Loiane Groner / YouTube",
      author: "Loiane Groner",
      description: "Aulas em português sobre Java, Spring Boot, Angular e boas práticas de backend.",
      searchQuery: "loiane java spring boot curso youtube",
    },
    book: {
      title: "Effective Java (3rd Edition)",
      url: "https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/",
      publisher: "Addison-Wesley",
      author: "Joshua Bloch",
      description: "Referência canônica de boas práticas, imutabilidade e design de APIs em Java.",
      searchQuery: "effective java joshua bloch livro",
    },
  },
  {
    keywords: ["c#", "csharp", ".net", "dotnet", "asp.net", "entity framework"],
    guide: {
      title: "Documentação Oficial de C# e .NET",
      url: "https://learn.microsoft.com/en-us/dotnet/csharp/",
      publisher: "Microsoft Learn",
      author: "Microsoft .NET Team",
      description: "Guia oficial da linguagem C#, LINQ, async/await, ASP.NET Core e Entity Framework.",
      searchQuery: "documentacao oficial csharp dotnet microsoft learn",
    },
    article: {
      title: "Tour of C# — Guia Guiado da Linguagem",
      url: "https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/",
      publisher: "Microsoft Learn",
      author: "Microsoft .NET Team",
      description: "Visão geral progressiva dos recursos da linguagem com exemplos comentados.",
      searchQuery: "tour of csharp microsoft learn",
    },
    video: {
      title: "Canal Oficial .NET",
      url: "https://www.youtube.com/@dotnet",
      publisher: ".NET / YouTube",
      author: "Microsoft .NET Team",
      description: "Vídeos oficiais sobre C#, ASP.NET Core, Blazor e novidades da plataforma .NET.",
      searchQuery: "dotnet youtube csharp aspnet core",
    },
    book: {
      title: "C# in Depth (4th Edition)",
      url: "https://www.manning.com/books/c-sharp-in-depth-fourth-edition",
      publisher: "Manning",
      author: "Jon Skeet",
      description: "Aprofundamento técnico em generics, LINQ, async e evolução da linguagem C#.",
      searchQuery: "c sharp in depth jon skeet livro",
    },
  },
  {
    keywords: ["golang", "goroutine", "gorm", "gin framework", "go language"],
    guide: {
      title: "Documentação Oficial da Linguagem Go",
      url: "https://go.dev/doc/",
      publisher: "Go Project",
      author: "Go Team",
      description: "Documentação oficial com guias de módulos, concorrência, testes e publicação.",
      searchQuery: "documentacao oficial golang go.dev",
    },
    article: {
      title: "Go by Example — Exemplos Práticos",
      url: "https://gobyexample.com/",
      publisher: "Go by Example",
      author: "Mark McGranaghan",
      description: "Exemplos comentados de goroutines, channels, interfaces e biblioteca padrão.",
      searchQuery: "go by example goroutines channels",
    },
    video: {
      title: "Cursos de Go no freeCodeCamp",
      url: "https://www.youtube.com/@freecodecamp",
      publisher: "freeCodeCamp / YouTube",
      author: "freeCodeCamp",
      description: "Cursos completos de Go e desenvolvimento backend disponíveis no canal.",
      searchQuery: "freecodecamp golang curso youtube",
    },
    book: {
      title: "The Go Programming Language",
      url: "https://www.gopl.io/",
      publisher: "Addison-Wesley",
      author: "Alan A. A. Donovan & Brian W. Kernighan",
      description: "Livro de referência sobre a linguagem Go, concorrência e engenharia de software.",
      searchQuery: "the go programming language livro gopl",
    },
  },
  {
    keywords: ["c++", "cpp", "linguagem c", "ponteiros", "stl", "c/c++"],
    guide: {
      title: "cppreference — Referência Completa de C e C++",
      url: "https://en.cppreference.com/w/",
      publisher: "cppreference.com",
      author: "Comunidade C++",
      description: "Referência técnica de tipos, STL, memória, templates e concorrência em C/C++.",
      searchQuery: "cppreference c++ reference stl",
    },
    article: {
      title: "ISO C++ FAQ — Perguntas Frequentes Oficiais",
      url: "https://isocpp.org/faq",
      publisher: "isocpp.org",
      author: "ISO C++ Committee",
      description: "Respostas canônicas sobre ponteiros, RAII, templates e boas práticas modernas.",
      searchQuery: "isocpp faq c++ moderno",
    },
    video: {
      title: "CppCon — Palestras Técnicas de C++",
      url: "https://www.youtube.com/@cppcon",
      publisher: "CppCon / YouTube",
      author: "CppCon",
      description: "Palestras avançadas sobre performance, templates, memória e evolução do C++.",
      searchQuery: "cppcon youtube c++ talks",
    },
    book: {
      title: "The C++ Programming Language (4th Edition)",
      url: "https://www.stroustrup.com/4th.html",
      publisher: "Addison-Wesley",
      author: "Bjarne Stroustrup",
      description: "Obra de referência do criador da linguagem, cobrindo C++ moderno e STL.",
      searchQuery: "the c++ programming language stroustrup livro",
    },
  },
  {
    keywords: ["php", "laravel", "composer", "symfony"],
    guide: {
      title: "Manual Oficial do PHP em Português",
      url: "https://www.php.net/manual/pt_BR/",
      publisher: "PHP Group",
      author: "PHP Documentation Team",
      description: "Manual oficial da linguagem, funções, PDO, sessões e boas práticas de segurança.",
      searchQuery: "manual oficial php portugues",
    },
    article: {
      title: "PHP: The Right Way",
      url: "https://phptherightway.com/",
      publisher: "PHP: The Right Way",
      author: "Comunidade PHP",
      description: "Guia de práticas modernas, PSRs, Composer, testes e segurança em PHP.",
      searchQuery: "php the right way boas praticas",
    },
    video: {
      title: "Laravel — Canal Oficial",
      url: "https://www.youtube.com/@LaravelPHP",
      publisher: "Laravel / YouTube",
      author: "Laravel Team",
      description: "Conteúdo oficial sobre Laravel, Eloquent, filas e deploy de aplicações PHP.",
      searchQuery: "laravel youtube oficial php",
    },
  },
  {
    keywords: ["ruby", "rails", "rubyonrails", "ruby on rails"],
    guide: {
      title: "Documentação Oficial do Ruby",
      url: "https://www.ruby-lang.org/pt/documentation/",
      publisher: "Ruby Community",
      author: "Ruby Core Team",
      description: "Documentação oficial da linguagem, biblioteca padrão e guias de instalação.",
      searchQuery: "documentacao oficial ruby portugues",
    },
    article: {
      title: "RubyGuides — Tutoriais de Ruby e Rails",
      url: "https://www.rubyguides.com/",
      publisher: "RubyGuides",
      author: "Jesus Castello",
      description: "Tutoriais práticos de Ruby, objetos, blocos, testes e Ruby on Rails.",
      searchQuery: "rubyguides tutoriais ruby rails",
    },
    video: {
      title: "Cursos de Ruby no freeCodeCamp",
      url: "https://www.youtube.com/@freecodecamp",
      publisher: "freeCodeCamp / YouTube",
      author: "freeCodeCamp",
      description: "Cursos completos de Ruby e Ruby on Rails disponíveis no canal.",
      searchQuery: "freecodecamp ruby rails curso youtube",
    },
    book: {
      title: "Why's (Poignant) Guide to Ruby",
      url: "https://poignant.guide/",
      publisher: "Poignant Guide",
      author: "why the lucky stiff",
      description: "Livro gratuito e clássico para aprender Ruby de forma leve e conceitual.",
      searchQuery: "poignant guide to ruby livro",
    },
  },
  {
    keywords: [
      "machine learning",
      "aprendizado de máquina",
      "aprendizado de maquina",
      "data science",
      "ciência de dados",
      "ciencia de dados",
      "deep learning",
      "inteligência artificial",
      "inteligencia artificial",
      "pytorch",
      "tensorflow",
      "scikit-learn",
      "pandas",
      "numpy",
      "rede neural",
      "llm",
    ],
    guide: {
      title: "scikit-learn — User Guide",
      url: "https://scikit-learn.org/stable/user_guide.html",
      publisher: "scikit-learn",
      author: "scikit-learn Developers",
      description: "Guia completo de pré-processamento, modelos, validação cruzada e métricas.",
      searchQuery: "scikit learn user guide machine learning",
    },
    article: {
      title: "Kaggle Learn — Trilhas de Data Science",
      url: "https://www.kaggle.com/learn",
      publisher: "Kaggle",
      author: "Kaggle Team",
      description: "Micro-cursos práticos de Python, pandas, machine learning e feature engineering.",
      searchQuery: "kaggle learn data science cursos",
    },
    video: {
      title: "Cursos de Machine Learning no freeCodeCamp",
      url: "https://www.youtube.com/@freecodecamp",
      publisher: "freeCodeCamp / YouTube",
      author: "freeCodeCamp",
      description: "Cursos completos de machine learning, deep learning e ciência de dados.",
      searchQuery: "freecodecamp machine learning curso youtube",
    },
    book: {
      title: "Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow",
      url: "https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/",
      publisher: "O'Reilly Media",
      author: "Aurélien Géron",
      description: "Referência prática de ML, redes neurais e deploy de modelos em produção.",
      searchQuery: "hands on machine learning aurelien geron livro",
    },
  },
  {
    keywords: [
      "segurança",
      "seguranca",
      "security",
      "owasp",
      "pentest",
      "criptografia",
      "vulnerabilidade",
      "ethical hacking",
    ],
    guide: {
      title: "OWASP Top 10 — Riscos de Segurança em Aplicações",
      url: "https://owasp.org/www-project-top-ten/",
      publisher: "OWASP Foundation",
      author: "OWASP Community",
      description: "Os dez riscos mais críticos em aplicações web e como mitigá-los.",
      searchQuery: "owasp top 10 seguranca aplicacoes web",
    },
    article: {
      title: "PortSwigger Web Security Academy",
      url: "https://portswigger.net/web-security",
      publisher: "PortSwigger",
      author: "PortSwigger Team",
      description: "Laboratórios gratuitos de SQL injection, XSS, CSRF, autenticação e controle de acesso.",
      searchQuery: "portswigger web security academy labs",
    },
    video: {
      title: "LiveOverflow — Segurança Ofensiva na Prática",
      url: "https://www.youtube.com/@LiveOverflow",
      publisher: "LiveOverflow / YouTube",
      author: "LiveOverflow",
      description: "Análises técnicas de vulnerabilidades, CTFs, exploração e engenharia reversa.",
      searchQuery: "liveoverflow seguranca ofensiva youtube",
    },
    book: {
      title: "The Web Application Hacker's Handbook",
      url: "https://www.oreilly.com/library/view/web-application-hackers/9781118026472/",
      publisher: "Wiley",
      author: "Dafydd Stuttard & Marcus Pinto",
      description: "Referência clássica de testes de invasão e ataques a aplicações web.",
      searchQuery: "web application hackers handbook livro",
    },
  },
  {
    keywords: [
      "testes automatizados",
      "teste unitário",
      "teste unitario",
      "testing",
      "jest",
      "vitest",
      "cypress",
      "tdd",
      "quality assurance",
    ],
    guide: {
      title: "Testing Library — Documentação Oficial",
      url: "https://testing-library.com/docs/",
      publisher: "Testing Library",
      author: "Testing Library Team",
      description: "Guias de testes focados no comportamento do usuário para React, DOM e Node.",
      searchQuery: "testing library docs react testes",
    },
    article: {
      title: "The Practical Test Pyramid — Martin Fowler",
      url: "https://martinfowler.com/articles/practical-test-pyramid.html",
      publisher: "martinfowler.com",
      author: "Ham Vocke",
      description: "Artigo de referência sobre unitários, integração e testes end-to-end.",
      searchQuery: "practical test pyramid martin fowler",
    },
    video: {
      title: "Cursos de Testes no freeCodeCamp",
      url: "https://www.youtube.com/@freecodecamp",
      publisher: "freeCodeCamp / YouTube",
      author: "freeCodeCamp",
      description: "Cursos de Jest, Cypress, TDD e automação de testes disponíveis no canal.",
      searchQuery: "freecodecamp testes jest cypress curso",
    },
    book: {
      title: "Unit Testing Principles, Practices, and Patterns",
      url: "https://www.oreilly.com/library/view/unit-testing-principles/9780131495050/",
      publisher: "Manning",
      author: "Vladimir Khorikov",
      description: "Como escrever testes sustentáveis, significativos e alinhados ao domínio.",
      searchQuery: "unit testing principles practices patterns livro",
    },
  },
  {
    keywords: [
      "aws",
      "azure",
      "gcp",
      "google cloud",
      "cloud computing",
      "computação em nuvem",
      "computacao em nuvem",
      "terraform",
      "serverless",
      "lambda",
    ],
    guide: {
      title: "Google Cloud — Documentação Oficial",
      url: "https://cloud.google.com/docs",
      publisher: "Google Cloud",
      author: "Google Cloud Team",
      description: "Guias de Compute Engine, Cloud Run, GKE, BigQuery, IAM e faturamento.",
      searchQuery: "google cloud documentacao oficial cloud run gke",
    },
    article: {
      title: "AWS — O que é Computação em Nuvem?",
      url: "https://aws.amazon.com/what-is-cloud-computing/",
      publisher: "Amazon Web Services",
      author: "AWS Team",
      description: "Conceitos de IaaS, PaaS, serverless, elasticidade e modelos de responsabilidade.",
      searchQuery: "aws o que e computacao em nuvem",
    },
    video: {
      title: "Google Cloud Tech — Canal Oficial",
      url: "https://www.youtube.com/@GoogleCloudTech",
      publisher: "Google Cloud / YouTube",
      author: "Google Cloud Team",
      description: "Tutoriais oficiais de Cloud Run, Kubernetes, BigQuery e arquitetura na GCP.",
      searchQuery: "google cloud tech youtube tutoriais",
    },
  },
  {
    keywords: ["linux", "bash", "shell script", "terminal", "ubuntu", "debian"],
    guide: {
      title: "The Linux Documentation Project",
      url: "https://tldp.org/",
      publisher: "TLDP",
      author: "Linux Documentation Project",
      description: "Guias clássicos de shell, administração de sistemas e comandos Linux.",
      searchQuery: "the linux documentation project guias shell",
    },
    article: {
      title: "Linux Foundation — Recursos e Guias",
      url: "https://www.linuxfoundation.org/",
      publisher: "Linux Foundation",
      author: "Linux Foundation",
      description: "Materiais sobre kernel, administração, containers e certificações Linux.",
      searchQuery: "linux foundation recursos guias",
    },
    video: {
      title: "Learn Linux TV — Tutoriais Práticos",
      url: "https://www.youtube.com/@LearnLinuxTV",
      publisher: "Learn Linux TV / YouTube",
      author: "Jay LaCroix",
      description: "Tutoriais de terminal, shell scripting, servidores e administração Linux.",
      searchQuery: "learn linux tv youtube terminal shell",
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
 * Word-boundary matching avoids false positives such as "data" matching
 * "database" or "js" matching "nextjs". Keywords with symbols (c++, c#, .net,
 * ci/cd) fall back to a plain substring match.
 */
function matchesKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = keyword.toLowerCase().trim();
  if (!normalizedKeyword) return false;

  if (/[^a-z0-9\s]/.test(normalizedKeyword)) {
    return text.includes(normalizedKeyword);
  }

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

function findBestCatalogEntry(normalizedText: string): TechnologyReference | undefined {
  let best: TechnologyReference | undefined;
  let bestScore = 0;

  for (const entry of TECH_CATALOG) {
    const score = entry.keywords.reduce(
      (total, keyword) => (matchesKeyword(normalizedText, keyword) ? total + keyword.length : total),
      0
    );

    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
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

  // Prefer the topic's own words. Using the roadmap title first would give
  // every topic in a React roadmap the React docs, even a "CSS Grid" topic.
  const topicText = [topicTitle, contextDescription || ""].join(" ").toLowerCase();

  const year = new Date().getFullYear().toString();

  // Find the most specific technology in our catalog
  const matched =
    findBestCatalogEntry(topicText) || findBestCatalogEntry(normalizedText);

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

  // Fallback for topics outside the curated catalog. These are real, general
  // developer portals — no fake topic-specific links and no search URLs.
  return [
    {
      type: "guide",
      title: "roadmap.sh — Guias de Estudo por Tecnologia",
      url: "https://roadmap.sh/",
      publisher: "roadmap.sh",
      author: "Comunidade roadmap.sh",
      year,
      description: `Roadmaps da comunidade para organizar o estudo de ${topicTitle} e tecnologias relacionadas.`,
      searchQuery: `roadmap ${topicTitle} guia de estudos`,
    },
    {
      type: "article",
      title: "freeCodeCamp — Artigos e Tutoriais em Português",
      url: "https://www.freecodecamp.org/portuguese/news/",
      publisher: "freeCodeCamp Brasil",
      author: "Comunidade freeCodeCamp",
      year,
      description: `Artigos técnicos e tutoriais práticos; use a busca do portal para encontrar conteúdo sobre ${topicTitle}.`,
      searchQuery: `freecodecamp portugues ${topicTitle} tutorial`,
    },
    {
      type: "video",
      title: "freeCodeCamp — Cursos em Vídeo",
      url: "https://www.youtube.com/@freecodecamp",
      publisher: "freeCodeCamp / YouTube",
      author: "freeCodeCamp",
      year,
      description: `Cursos completos e gratuitos de programação; procure por ${topicTitle} no canal.`,
      searchQuery: `freecodecamp ${topicTitle} curso completo`,
    },
    {
      type: "book",
      title: "O'Reilly — Catálogo Técnico",
      url: "https://www.oreilly.com/",
      publisher: "O'Reilly Media",
      author: "O'Reilly Media",
      year,
      description: `Catálogo de livros técnicos para aprofundamento em ${topicTitle}.`,
      searchQuery: `oreilly ${topicTitle} livro`,
    },
  ];
}
