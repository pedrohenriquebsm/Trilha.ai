# Trilha.ai

Plataforma de geração automatizada de roadmaps de estudo utilizando Inteligência Artificial para tecnologia e desenvolvimento de software.

## 🚀 Arquitetura (Next.js 15 App Router)

O projeto foi migrado de uma SPA em Vite + Express para **Next.js 15 (App Router)** em TypeScript, unificando front-end e rotas de API em uma única arquitetura robusta.

### Estrutura de Rotas e Pastas

- `src/app/layout.tsx`: Root Layout com tema claro/escuro, fontes Google e cabeçalho de navegação.
- `src/app/page.tsx`: Página inicial com Hero e lista de trilhas em destaque.
- `src/app/discover/page.tsx`: Busca em tempo real de trilhas públicas.
- `src/app/create/page.tsx`: Criação de roadmaps guiada por IA em 3 etapas.
- `src/app/roadmap/[id]/page.tsx`: Visualização da trilha com Dnd-kit (drag-and-drop), quizzes, desafios práticos e progresso em nuvem.
- `src/app/not-found.tsx`: Página customizada para rotas não encontradas.
- `src/app/api/gemini/enhance-prompt/route.ts`: Route Handler para aprimoramento pedagógico de prompts.
- `src/app/api/gemini/decompose-topic/route.ts`: Route Handler para decomposição nos 5 níveis hierárquicos.
- `src/app/api/gemini/curate-content/route.ts`: Route Handler para curadoria didática e busca de fontes (Search grounding).
- `src/app/api/gemini/generate-challenge/route.ts`: Route Handler para quizzes e atividades práticas com código.
- `src/app/api/gemini/topic-content-and-sources/route.ts`: Route Handler para adição sob demanda de novos tópicos.

### Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
GEMINI_API_KEY=sua_chave_gemini_aqui
```

### Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento na porta 3000
npm run dev

# Gerar build de produção
npm run build

# Executar build de produção
npm run start

# Executar linter
npm run lint
```
