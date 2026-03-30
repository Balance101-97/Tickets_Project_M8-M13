# Checklist de implementação (Node.js) — Projeto Ticket System (Main + Receiver)

> Estrutura recomendada (2 servidores):
>
> - `server-main/`  → API + DB + CSV import + stats + webhooks + Swagger
> - `server-receiver/` → recebe webhooks, valida segredo e imprime na consola

---

## 0) Regras rápidas (para não te perderes vindo de C/C++)
- **Routes**: só definem caminhos e chamam controllers.
- **Controllers**: pegam no `req/res` e chamam services.
- **Services**: lógica de negócio (regras, decidir eventos, chamar repositories).
- **Repositories**: falam com a DB (SQL/queries).
- **Middlewares**: validações, auth, erros, parsing.
- **Utils**: coisas reutilizáveis (logger, http client).

---

# SERVER MAIN (API)

## 1) Setup base

### `server-main/package.json`
- Define scripts:
  - `dev`: correr com nodemon (opcional)
  - `start`: correr servidor
- Define `"type": "module"` para usar `import`

### `server-main/.env.example`
- Contém as variáveis necessárias:
  - `PORT=3000`
  - `WEBHOOK_SECRET=...`
  - `CSV_PATH=...`
  - `DATABASE_URL=...` (se usares SQLite podes ter `DB_FILE=...`)

### `server-main/src/server.js`
**Objetivo:** ponto de entrada do servidor
Checklist:
- [x] `dotenv.config()`
- [x] `await db.connect()`
- [x] `await db.migrate()`
- [ x] Se DB não tiver tickets: `await csvImportService.importIfEmpty()`
- [x] `app.listen(PORT)`

### `server-main/src/app.js`
**Objetivo:** configurar o Express
Checklist:
- [x] `const app = express()`
- [x] `app.use(express.json())`
- [x] montar rotas:
  - [x] `/health`
  - [ ] `/tickets`
  - [ ] `/stats`
  - [ ] `/webhooks`
  - [ ] `/docs` (Swagger)
- [ ] `app.use(errorMiddleware)` no fim
- [ ] `export default app`

---

## 2) Rotas (Main)

### `server-main/src/routes/health.routes.js`
**Objetivo:** health check
Checklist:
- [ ] `GET /health` → `{ status: "ok" }`

### `server-main/src/routes/tickets.routes.js`
**Objetivo:** CRUD + listagem
Checklist:
- [ ] `GET /tickets` (filtros + paginação)
- [ ] `GET /tickets/:id`
- [ ] `POST /tickets`
- [ ] `PATCH /tickets/:id`
- [ ] `DELETE /tickets/:id`

### `server-main/src/routes/stats.routes.js`
**Objetivo:** endpoints de estatísticas (mínimo 3)
Checklist:
- [ ] `GET /stats/by-status`
- [ ] `GET /stats/by-priority`
- [ ] `GET /stats/top-assignees` (ou equivalente)

### `server-main/src/routes/webhooks.routes.js`
**Objetivo:** gerir subscrições
Checklist:
- [ ] `POST /webhooks/subscriptions` (registar URL + eventos)
- [ ] `GET /webhooks/subscriptions` (listar)
- [ ] (Opcional) `DELETE /webhooks/subscriptions/:id`

---

## 3) Controllers (Main)

### `server-main/src/controllers/tickets.controller.js`
**Objetivo:** ligar HTTP ↔ services
Checklist:
- [ ] Validar inputs básicos (ou delegar em middleware)
- [ ] Chamar `ticketsService.*`
- [ ] Responder com status correto:
  - [ ] 200/201/204
  - [ ] 400 (input inválido)
  - [ ] 404 (id não existe)

### `server-main/src/controllers/stats.controller.js`
Checklist:
- [ ] chamar `statsService.*`
- [ ] devolver JSON com resultados

### `server-main/src/controllers/webhooks.controller.js`
Checklist:
- [ ] validar `{ url, events }`
- [ ] chamar `webhooksService.subscribe(...)`
- [ ] devolver `201` com subscrição criada

---

## 4) Services (Main)

### `server-main/src/services/csvImport.service.js`
**Objetivo:** importar CSV para DB
Checklist:
- [ ] `importIfEmpty()`:
  - [ ] `countTickets()`
  - [ ] se 0 → ler CSV em stream e inserir
- [ ] normalizar campos (status, priority, datas)

### `server-main/src/services/tickets.service.js`
**Objetivo:** lógica do domínio tickets
Checklist:
- [ ] `list(filters, limit, offset)` → usa repo
- [ ] `getById(id)` → repo
- [ ] `create(data)`:
  - [ ] validar campos mínimos
  - [ ] inserir na DB
  - [ ] disparar webhook `ticket.created` (sem bloquear)
- [ ] `update(id, patch)`:
  - [ ] buscar ticket antigo
  - [ ] aplicar patch permitido
  - [ ] atualizar DB
  - [ ] disparar `ticket.updated`
  - [ ] se status mudou para closed → disparar `ticket.closed`
- [ ] `remove(id)` → apagar/soft delete

### `server-main/src/services/stats.service.js`
Checklist:
- [ ] `byStatus()` → GROUP BY status
- [ ] `byPriority()` → GROUP BY priority
- [ ] `topAssignees()` → GROUP BY assignee ORDER BY count desc

### `server-main/src/services/webhooks.service.js`
**Objetivo:** subscrições + envio de webhooks
Checklist:
- [ ] `subscribe(url, events)` → repo insert
- [ ] `listSubscriptions()` → repo select
- [ ] `notifyAsync(eventType, payload)`:
  - [ ] buscar subscritores desse evento
  - [ ] para cada URL: fazer POST com header `X-Webhook-Secret`
  - [ ] **não bloquear** o request (fire-and-forget com `.catch()`)

---

## 5) Repositories (Main)

### `server-main/src/repositories/tickets.repo.js`
**Objetivo:** SQL/DB de tickets
Checklist:
- [ ] `count()`
- [ ] `insert(ticket)`
- [ ] `findById(id)`
- [ ] `update(id, fields)`
- [ ] `delete(id)` (ou `archive`)
- [ ] `list(filters, limit, offset)`:
  - [ ] implementar pelo menos 4 filtros (ex: status, priority, assignee, search)
  - [ ] suportar paginação

### `server-main/src/repositories/webhooks.repo.js`
Checklist:
- [ ] `insertSubscription(url, events)`
- [ ] `listSubscriptions()`
- [ ] `findByEvent(eventType)` (filtra os que têm esse evento)
- [ ] (Opcional) `deleteSubscription(id)`

---

## 6) DB (Main)

### `server-main/src/db/index.js`
**Objetivo:** ligação à DB e helpers
Checklist:
- [ ] `connect()`
- [ ] `query(sql, params)` (helper)
- [ ] `close()` (opcional)

### `server-main/src/db/schema.sql`
**Objetivo:** criar tabelas
Checklist:
- [ ] tabela `tickets`
- [ ] tabela `webhook_subscriptions`
- [ ] índices úteis (ex: status, priority, assignee)

---

## 7) Middlewares e Utils (Main)

### `server-main/src/middlewares/error.middleware.js`
Checklist:
- [ ] apanhar erros e responder com JSON
- [ ] logar stack (dev) sem expor detalhes em produção

### `server-main/src/middlewares/validate.middleware.js` (opcional)
Checklist:
- [ ] validar body/query de endpoints críticos

### `server-main/src/utils/httpClient.js`
Checklist:
- [ ] função `postJson(url, body, headers)` (usa fetch/axios)
- [ ] tratar timeouts/erros e devolver erro controlado

### `server-main/src/utils/logger.js` (opcional)
Checklist:
- [ ] `info/warn/error`
- [ ] logs consistentes (para debug)

---

<!-- ## 8) Swagger (Main)

### `server-main/src/docs/openapi.yaml`
Checklist:
- [ ] documentar `/health`
- [ ] documentar `/tickets` CRUD + query params (filtros/paginação)
- [ ] documentar `/stats/*`
- [ ] documentar `/webhooks/subscriptions`
- [ ] definir schemas (Ticket, Subscription, WebhookPayload)

### `server-main/src/routes/docs.routes.js` (ou no `app.js`)
Checklist:
- [ ] montar Swagger UI em `GET /docs`

--- -->

# SERVER RECEIVER (Webhook Listener)

## 1) Setup base

### `server-receiver/package.json`
Checklist:
- [ ] scripts `start/dev`
- [ ] `"type": "module"`

### `server-receiver/.env.example`
Checklist:
- [ ] `PORT=4000`
- [ ] `WEBHOOK_SECRET=...` (igual ao main)

### `server-receiver/src/server.js`
Checklist:
- [ ] `dotenv.config()`
- [ ] `app.listen(PORT)`

### `server-receiver/src/app.js`
Checklist:
- [ ] `express.json()`
- [ ] montar `/health` e `/webhook`
- [ ] error middleware (opcional)

---

## 2) Rotas/Controllers/Middleware (Receiver)

### `server-receiver/src/routes/health.routes.js`
Checklist:
- [ ] `GET /health` → `{ status: "ok" }`

### `server-receiver/src/middlewares/verifyWebhookSecret.middleware.js`
Checklist:
- [ ] ler `req.headers["x-webhook-secret"]`
- [ ] comparar com `process.env.WEBHOOK_SECRET`
- [ ] se falhar → `401`

### `server-receiver/src/routes/webhookReceiver.routes.js`
Checklist:
- [ ] `POST /webhook`
- [ ] usar middleware `verifyWebhookSecret`

### `server-receiver/src/controllers/webhookReceiver.controller.js`
Checklist:
- [ ] ler `{ event, data, sentAt }`
- [ ] imprimir na consola:
  - [ ] tipo de evento
  - [ ] id do ticket
  - [ ] campos principais (status/priority/assignee)
- [ ] responder `204 No Content`

---

# Ordem de implementação (mini-checklist por sequência)

1. [ ] Subir **main** com `GET /health`
2. [ ] Subir **receiver** com `GET /health`
3. [ ] Fazer DB + migrations no main
4. [ ] Importar CSV no arranque (se DB vazia)
5. [ ] Implementar `GET /tickets` (com limit/offset simples)
6. [ ] Implementar resto do CRUD
7. [ ] Implementar 4 filtros na listagem
8. [ ] Implementar 3 stats
9. [ ] Implementar registo/listagem de subscrições webhook
10. [ ] Implementar `notifyAsync` e disparar em create/update/close
11. [ ] Receiver valida segredo e imprime
12. [ ] Swagger em `/docs` documentando tudo

---

# Testes rápidos (manuais)
- [ ] Registar subscrição: URL do receiver + eventos
- [ ] Criar ticket → receiver imprime `ticket.created`
- [ ] Atualizar ticket → imprime `ticket.updated`
- [ ] Mudar status para closed → imprime `ticket.closed`
- [ ] Mandar webhook com segredo errado → `401`


1. Servidor arranca
2. Ambiente é carregado (.env)
3. Base de dados fica pronta
4. Dados iniciais existem
5. API começa a aceitar requests

# Delivery
- [ ] Do not delivery csv file
- [ ] revirew .gitignore
    - [ ] .env
    - [ ] node_modules