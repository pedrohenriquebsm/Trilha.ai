# Trilha.ai

Plataforma de geração de trilhas de estudo (roadmaps) para tecnologia, com curadoria de fontes, conteúdo explicativo sob demanda e desafios práticos gerados por IA.

## Stack

- **Next.js 16.4.3** (App Router, Route Handlers) + **React 19.3.1** + **TypeScript 7** (Node.js 22+)
- **Tailwind CSS 4.3** + **daisyUI 5.7.50**
- **Firebase Auth** (Google) + **Cloud Firestore 13.1**
- **OpenRouter** (modelos gratuitos, via SDK da OpenAI 7.45)
- **Vitest** para testes unitários

> O TypeScript 7 usa o compilador nativo. Como o `typescript-eslint` ainda depende da API do TypeScript 6, o ESLint usa `@babel/eslint-parser` apenas para análise sintática. A checagem de tipos continua sendo feita por `npm run typecheck` (`tsc --noEmit`).

> O projeto **não usa Gemini** e não precisa de `GEMINI_API_KEY`. A única chave de IA necessária é `OPENROUTER_API_KEY`.
>
> O `metadata.json` mantém a capability de runtime do AI Studio por compatibilidade com a plataforma; ela não é usada pelo código e não exige chave do Gemini.

## Rodando no Google AI Studio

O projeto foi mantido compatível com o ambiente de desenvolvimento do AI Studio:

- `npm run dev` escuta em `0.0.0.0:3000` (obrigatório para o proxy do AI Studio).
- Não há servidor customizado, `output: "standalone"` nem dependência de arquivos locais fora do repositório.
- Os headers de segurança **não bloqueiam iframe** (o preview do AI Studio roda a aplicação dentro de um iframe).
- As fontes usam `<link>`/`@import` do Google Fonts com fallback para fontes do sistema; não há download de fonte no build.
- A chave da IA é lida **somente no servidor** (`process.env.OPENROUTER_API_KEY`).

### Passos

1. Instale as dependências:

   ```bash
   npm install
   ```

2. No AI Studio, abra **Settings → Secrets** e cadastre:

   | Secret | Obrigatória | Descrição |
   | --- | --- | --- |
   | `OPENROUTER_API_KEY` | Sim | Chave da OpenRouter usada pelos Route Handlers. |
   | `OPENROUTER_MODEL` | Não | Modelo padrão. Se vazio, usa `openrouter/free`. |
   | `NEXT_PUBLIC_APP_URL` | Não | URL pública. O AI Studio injeta `APP_URL` automaticamente. |

3. Inicie o servidor:

   ```bash
   npm run dev
   ```

4. Publique as regras do Firestore (uma vez por projeto, ou após alterá-las):

   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```

   O projeto e o database ID já estão em `firebase.json` / `.firebaserc`.

> **Importante:** o AI Studio normalmente instala as dependências e executa `npm run dev` por conta própria. O `package-lock.json` está versionado para builds reproduzíveis; o antigo `bun.lock` foi removido por estar inconsistente.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` apenas se estiver rodando fora do AI Studio.

```bash
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_MODEL="openrouter/free"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`OPENROUTER_MODEL` deve ser um ID válido em <https://openrouter.ai/models>. O padrão e o fallback interno usam `openrouter/free`, o roteador que escolhe um modelo gratuito disponível. Evite fixar um modelo `:free` específico: modelos gratuitos podem retornar `429` quando estão temporariamente limitados.

## Como a geração funciona

A criação de uma trilha usa **uma** chamada de IA:

1. **Agente Curricular**: recebe o tema (e o escopo enriquecido quando o tema é
   curto) e devolve 40 tópicos — 8 por nível — em TOON tabular
   (`topics[40]{lv|t|d|s}:`). O parser (`src/lib/curriculumParser.ts`) valida,
   deduplica e rejeita níveis com menos de 4 tópicos.

O tema só passa pelo **Prompt Enhancer** quando tem menos de 3 palavras. A
curadoria de conteúdo do primeiro tópico é **lazy**: o texto é gerado quando o
usuário abre o tópico, pelo botão **Gerar Conteúdo com IA**.

`NEXT_PUBLIC_CURRICULUM_V2="0"` restaura o pipeline antigo de quatro agentes
(`enhance-prompt` → `list-topics` → `curate-references` → `structure-roadmap`),
que continua disponível nas rotas por um release.

O primeiro tópico é pré-curado para onboarding; os demais podem ser expandidos sob demanda na página da trilha. Em **Research Mode**, a trilha nasce apenas com fontes; o botão **Gerar Conteúdo com IA** força a geração do texto explicativo.

### Fontes (cite-or-drop)

Referências sugeridas pela IA só entram se o domínio estiver na allowlist de
`src/lib/sourcePolicy.ts` **e** a URL responder com sucesso (`HEAD`, com fallback
para `GET`). O restante é descartado e preenchido pelo catálogo curado de
`src/lib/sourceHelper.ts` — nunca por uma referência inventada.
`STRICT_SOURCES="0"` desliga a política.

### Níveis

`0` Fundamentos / Pré-requisitos · `1` Iniciante · `2` Intermediário · `3` Avançado · `4` Próximos Passos

## Segurança

- **Todas as rotas `/api/gemini/*` exigem Firebase ID Token** (`Authorization: Bearer ...`), validado no servidor com as chaves públicas do Google (`jose`). Não é necessário service account.
- Rate limit em memória por usuário (30 req/min; 20 req/min nas rotas de criação).
- Limite de tamanho e validação de todos os corpos de requisição.
- **Regras do Firestore** impedem que o usuário aumente `credits`, troque `plan`/`role` ou altere `email`. O débito de 1 crédito é feito em transação atômica junto com a criação da trilha e dos tópicos.
- Fontes sugeridas pela IA passam por validação de esquema e checagem de URLs obviamente quebradas (404/410), com proteção contra SSRF.
- Headers: `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy`.

### Limitações conhecidas

- O rate limit é local à instância. Em múltiplas instâncias, use Redis/Upstash.
- O bloqueio de cota é feito pelas regras + transação no cliente e por uma checagem de `credits > 0` nas rotas de criação. Para cobrança à prova de chamadas diretas à API, mova a transação de débito para o servidor (Cloud Functions/Admin SDK).
- A limpeza de progresso ao excluir uma trilha remove apenas os registros do próprio usuário (as regras não permitem apagar progresso de terceiros).
- A verificação de URLs é conservadora: links que bloqueiam bots ou expiram podem ser mantidos.

## Rotas de API

| Rota | Função |
| --- | --- |
| `POST /api/gemini/curriculum` | Agente 2 (v2) — 40 tópicos em uma chamada TOON |
| `POST /api/gemini/enhance-prompt` | Agente 1 — refinamento de escopo |
| `POST /api/gemini/list-topics` | Agente 2 — grade curricular |
| `POST /api/gemini/curate-references` | Agente 3 — referências canônicas |
| `POST /api/gemini/structure-roadmap` | Agente 4 — JSON/TOON estruturado |
| `POST /api/gemini/curate-content` | Conteúdo + fontes de um tópico |
| `POST /api/gemini/topic-content-and-sources` | Conteúdo sob demanda ao adicionar tópico |
| `POST /api/gemini/generate-challenge` | Quiz + atividade prática |

Todas retornam `{ error }` com status adequado (400, 401, 402, 413, 429, 502, 503, 504).

## Scripts

```bash
npm run dev        # desenvolvimento em 0.0.0.0:3000
npm run build      # build de produção
npm run start      # produção em 0.0.0.0:3000
npm run lint       # ESLint (next lint)
npm run typecheck  # tsc --noEmit
npm run test       # Vitest
```

## Estrutura

```text
src/
  app/
    api/gemini/*/route.ts   # 7 Route Handlers autenticados
    create/                 # wizard de criação (transação atômica)
    discover/               # trilhas públicas + "Minhas Trilhas" (inclui privadas)
    roadmap/[id]/           # detalhe da trilha
    error.tsx, global-error.tsx, loading.tsx
  components/               # Layout, AuthProvider, RoadmapView, cards...
  hooks/                    # useAuth (contexto), usePublicRoadmaps, useMyRoadmaps...
  lib/
    apiGuard.ts, serverAuth.ts, apiError.ts
    llm.ts, llmJson.ts, toonParser.ts
    sourceHelper.ts, urlVerifier.ts
  services/                 # geminiService (cliente) e contentService (servidor)
firestore.rules             # créditos, permissões e validação
firebase.json               # deploy das regras (database do AI Studio)
```

## Testes

```bash
npm test
```

Cobrem o parser TOON (incluindo níveis vazios, duplicatas e desafio sem quiz), o parser de JSON da IA, a validação de entrada e a seleção de fontes por palavra-chave.
