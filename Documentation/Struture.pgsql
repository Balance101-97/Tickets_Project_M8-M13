ticket-system/
  README.md
  [x] server-main/
  [x]  package.json
  [x]  .env
    [x] src/
      [] app.js
      [] server.js
      []routes/
        [] healthRoutes.js
        tickets.routes.js
        webhooks.routes.js
        stats.routes.js
      [] controllers/logic
        tickets.controller.js
        webhooks.controller.js
        stats.controller.js
      [] services/persistence
        tickets.service.js
        webhooks.service.js
        [] csvImport.service.js
      [] repositories/setup BD
        tickets.repo.js
        webhooks.repo.js
      [x] db/csv
        [] index.js
        schema.sql
      [] middlewares/
        errorMiddleware.js
        validate.middleware.js
      utils/
        logger.js
        httpClient.js
      [] docs/
        openapi.yaml
      data/
        tickets.csv   (ou só local, se o Moodle fornecer)
  server-receiver/
    package.json
    .env.example
    src/
      app.js
      server.js
      routes/
        health.routes.js
        webhookReceiver.routes.js
      controllers/
        webhookReceiver.controller.js
      middlewares/
        verifyWebhookSecret.middleware.js


extra e que nao e necessario fazer:
      middlewares/
        error.middleware.js
        validate.middleware.js
      utils/
        logger.js
        httpClient.js










componentes de MVC ou MVVC

ler middlewares:
[] https://www.w3schools.com/nodejs/nodejs_middleware.asp

perceber melhor express:
[x] https://www.w3schools.com/nodejs/nodejs_express.asp

!!!!!IMPORTANTE!!!!!
https://www.w3schools.com/nodejs/nodejs_rest_api.asp
Key Components:

Express Router: For organizing routes
Middleware: For cross-cutting concerns
Controllers: For handling request logic
Models: For data access and business logic
Services: For complex business logic



outros:
[] https://www.w3schools.com/js/js_api_intro.asp
[] https://www.w3schools.com/nodejs/nodejs_async.asp
[] https://www.w3schools.com/nodejs/nodejs_async_await.asp
[] https://www.w3schools.com/nodejs/nodejs_npm.asp
[] https://www.w3schools.com/nodejs/nodejs_package_json.asp
[] https://www.w3schools.com/nodejs/nodejs_modules_esm.asp


[] porque temos um server.js e um app.js
  [] Paulo - para no fim apanhar erros de todas as rotas
    [] export default

[]  pesquisar:
    [] [] export default
usar modelos para filtrar as infos que vem da base de dados

#nao por csv no gitHub