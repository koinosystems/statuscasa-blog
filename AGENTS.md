# AGENTS.md — Koinosystems Blog

## Propósito

Serviço de conteúdo (blog/magazine) do ecossistema Koinosystems. Cloudflare Worker com Hono + D1.

## Regras Essenciais

- Nunca usar `any` — usar tipos específicos.
- Código em inglês, UI em português BR (com acentos).
- Zero barrel exports — nunca criar index.ts de re-export.
- Naming: kebab-case para arquivos, camelCase para código, PascalCase para componentes.
- Import order: (1) externos, (2) componentes, (3) hooks, (4) api, (5) constants, (6) types.
- `npm run build`, `npm run lint` e `npm test` devem passar antes de commit.

## Rotas Públicas (sem auth)

- `GET /content/published?page&limit` — lista de posts publicados (usado pela magazine)
- `GET /content/:slug` — post individual
- `GET /comments/:contentId`, `GET /comments/:contentId/count`
- `GET /likes/:contentId`, `GET /shares/:contentId`
- `POST /shares/register` — registro de compartilhamento

## Rotas Autenticadas (Bearer JWT ou x-service-token)

- `POST /content`, `PATCH /content/:id`, `PUT /content/:id/publish`, `DELETE /content/:id`
- `POST /comments`, `DELETE /comments/:id`
- `POST /likes/toggle`

## Referência Completa

Consulte `koinosystems-harness/AGENTS.md` para o conjunto completo de regras do workspace.
