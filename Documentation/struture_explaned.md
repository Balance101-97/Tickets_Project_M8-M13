# Função de cada parte da estrutura do projeto

Vou explicar **por camadas**, porque isso ajuda a perceber a lógica e a responsabilidade de cada pasta/ficheiro.

---

## Raiz: `ticket-system/`

### `README.md`
Documento de entrada do projeto.

Contém:
- Como correr o projeto
- Variáveis de ambiente necessárias
- Endpoints disponíveis
- Como testar webhooks
- Notas importantes de setup

👉 Serve para qualquer pessoa (ou tu no futuro) perceber rapidamente o projeto.

---

## `server-main/` — API principal

Este servidor é o **cérebro do sistema**: gere tickets, estatísticas, documentação e webhooks.

---

### `package.json`
- Scripts (`start`, `dev`, etc.)
- Dependências (`express`, `dotenv`, etc.)
- `"type": "module"` para usar `import/export`

---

### `.env`
- Configurações reais do ambiente:
  - `PORT`
  - `DATABASE_URL`
  - `WEBHOOK_SECRET`
  - Paths, etc.
- **Nunca vai para o git**

---

## `src/server.js`

Responsável pelo **arranque da aplicação**.

Funções típicas:
- Carregar variáveis de ambiente (`dotenv`)
- Ligar à base de dados
- Executar migrations
- Importar CSV (se necessário)
- `listen(PORT)`

**Regra mental**  
> `server.js` = *“liga o carro”*

---

## `src/app.js`

Configuração do Express.

Responsabilidades:
- Criar a app (`express()`)
- `express.json()`
- Montar rotas:
  - `/health`
  - `/tickets`
  - `/stats`
  - `/webhooks`
  - `/docs`
- Ligar o middleware de erro no fim

**Regra mental**  
> `app.js` = *“monta o painel e as portas”* (mas não arranca o motor)

---

## Rotas — `src/routes/`

Exemplo: `tickets.routes.js`

Responsabilidade:
- Definir **que URL chama que controller**
- Não contém lógica de negócio

Exemplos:
- `GET /tickets → ticketsController.list`
- `POST /webhooks → webhooksController.receive`

---

## Controllers — `src/controllers/`

*(Na tua árvore aparece como `controllers/logic`, mas pode ser só `controllers/`)*

Responsabilidades:
- Receber `req` e `res`
- Validar inputs básicos (ou delegar em middleware)
- Chamar services
- Devolver resposta HTTP

**Regra mental**  
> Controller = *“tradutor HTTP”*  
> (converte request HTTP em chamadas internas e devolve response)

---

## Services — `src/services/`

*(Podes separar em `services/` e `services/persistence/`, mas não é obrigatório)*

Aqui vive a **lógica de negócio**.

Responsabilidades:
- Regras do domínio:
  - Criar ticket
  - Calcular estatísticas
  - Processar webhooks
- Chamar repositórios para ler/escrever dados

Exemplos:
- `tickets.service.js`: criar, listar, filtrar, paginar tickets
- `stats.service.js`: calcular métricas
- `csvImport.service.js`: importar CSV quando a DB está vazia

**Regra mental**  
> Service = *“cérebro do negócio”*

---

## Repositories — `src/repositories/`

*(Na tua árvore: `repositories/setup BD`, mas idealmente só `repositories/`)*

Camada que fala **diretamente com a base de dados**.

Responsabilidades:
- Queries SQL
- Inserts, updates, selects
- Abstração do acesso à DB

Exemplos:
- `tickets.repo.js`: `findAll()`, `insertMany()`, `count()`
- `webhooks.repo.js`: guardar eventos, idempotência

**Regra mental**  
> Repo = *“mãos na massa com a base de dados”*

---

## DB / Schema / CSV helpers — `src/db/`

Na tua estrutura:
- `schema.sql`
- `db/index.js`
- `db/csv/index.js`

Responsabilidades:
- `schema.sql`: criação das tabelas
- `db/index.js`: ligação à DB e helpers SQL
- `db/csv/index.js`: parsing de CSV (ou pode ir para services)

**DB = infraestrutura de persistência**

---

## Middlewares — `src/middlewares/`

Responsabilidades transversais (antes de chegar ao controller):

- `error.middleware.js`
  - Captura erros
  - Devolve JSON consistente
- `validate.middleware.js`
  - Validação de `req.body`, `params`, etc.
- (no receiver) `verifyWebhookSecret.middleware.js`
  - Valida segredo/assinatura

**Regra mental**  
> Middleware = *“segurança, validação e controlo de fluxo”*

---

## Utils — `src/utils/`

Ferramentas partilhadas pelo projeto.

Exemplos:
- `logger.js`: logs padronizados
- `httpClient.js`: chamadas HTTP externas (axios/fetch configurado)
- Helpers genéricos

**Regra mental**  
> Utils = *“caixa de ferramentas”*

---

## Docs — `src/docs/openapi.yaml`

- Definição OpenAPI / Swagger
- Documenta endpoints
- Permite testar via UI

Normalmente montado em:
- `/docs` no `app.js`

---

## Data — `src/data/tickets.csv`

- Dataset inicial
- Usado pelo `csvImport.service.js`
- Pode existir só localmente (ex.: Moodle fornece)

---

# `server-receiver/` — Receptor de Webhooks

Servidor separado e mais simples.

Responsabilidades:
- Receber webhooks externos (ou do `server-main`)
- Validar segredo
- Encaminhar ou transformar dados

Estrutura semelhante ao `server-main`:
- `app.js`: monta rotas
- `server.js`: arranca servidor
- `verifyWebhookSecret.middleware.js`: protege endpoints
- Controller: processa o webhook recebido

---

## Resumo mental rápido

- **server.js** → arranque
- **app.js** → configuração
- **routes** → URLs
- **controllers** → HTTP
- **services** → regras de negócio
- **repositories** → base de dados
- **middlewares** → validação e segurança
- **utils** → helpers
- **db** → infraestrutura

Se quiseres, posso transformar isto num **diagrama ASCII** ou num **mapa de fluxo request → response** 👀
