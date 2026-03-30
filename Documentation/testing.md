CSV_PATH="/mnt/c/Users/asus/Documents/UpSkills/8. Introdução à programação em Javascript/data.csv" npm run dev

node scripts/smoke-test.mjs
ou 
node scripts/smoke-test.mjs

Health
curl http://localhost:3000/health
CSV_PATH="/mnt/c/Users/asus/Documents/UpSkills/8. Introdução à programação em Javascript/data.csv" npm run dev

## Health
    main
    [x] curl http://localhost:3000/health
    rceiver
    [x] curl http://localhost:4000/health

## Webhook Subscriptions (server-main)
2.1 Listar subscriptions
[x] curl http://localhost:3000/webhooks/subscriptions

2.2 Criar subscription (apontar para o receiver)
[x] curl -X POST http://localhost:3000/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:4000/webhooks",
    "events": ["ticket.created","ticket.updated","ticket.deleted"]
  }'
  curl -X POST http://localhost:3000/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:5000/webhooks",
    "events": ["ticket.created","ticket.updated","ticket.deleted"]
  }'

2.3 Apagar subscription (troca <SUB_ID>)
[x] curl -X DELETE http://localhost:3000/webhooks/subscriptions/<SUB_ID>

2.4 Testar dispatch manual (server-main envia para as subscriptions)
[] curl -X POST http://localhost:3000/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ticket.test",
    "payload": { "hello": "world" }
  }'


Confirma no terminal do receiver que ele loga o webhook.

3) Tickets CRUD (server-main)
3.1 Listar tickets (default)
[x] curl http://localhost:3000/tickets

3.2 Listar tickets com paginação
[x] curl "http://localhost:3000/tickets?offset=0&limit=10"
[x] curl "http://localhost:3000/tickets?offset=10&limit=10"
[x] curl "http://localhost:3000/tickets?offset=20&limit=10"

3.3 Listar tickets filtrando por status
[x] curl "http://localhost:3000/tickets?status=Open"

3.4 Listar tickets filtrando por priority
[x] curl "http://localhost:3000/tickets?priority=1"

3.5 Listar tickets filtrando por CI_Name
[x] curl "http://localhost:3000/tickets?ci_Cat=Payment%20API"
[x] curl "http://localhost:3000/tickets?ci_cat=Backend"


3.6 Combinar filtros + paginação
[x] curl "http://localhost:3000/tickets?status=Open&priority=2&offset=0&limit=10"

3.7 Ordenação (se o repo suportar os campos)
[x] curl "http://localhost:3000/tickets?sort_by=id&sort_dir=asc&offset=0&limit=10"
[x] curl "http://localhost:3000/tickets?sort_by=id&sort_dir=desc&offset=0&limit=10"

3.8 Criar ticket (dispara ticket.created)
[x] curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "CI_Name": "Payment API",
    "CI_Cat": "Backend",
    "Status": "Open",
    "Priority": "2",
    "Open_Time": "2026-02-03T10:00:00Z",
    "Close_Time": null
  }'


[x] ✅ Verifica no receiver: deve aparecer ticket.created. 

ticketController

3.9 Obter ticket por id (troca <ID>)
[] curl http://localhost:3000/tickets/<ID>

3.10 Atualizar ticket (dispara ticket.updated)
[x] curl -X PATCH http://localhost:3000/tickets/46621 \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "Closed",
    "Close_Time": "2026-02-03T11:00:00Z"
  }'


[x] ✅ Verifica no receiver: deve aparecer ticket.updated. 

ticketController

3.11 Apagar ticket (dispara ticket.deleted)
[x] curl -X DELETE http://localhost:3000/tickets/44622

[x] ✅ Verifica no receiver: deve aparecer ticket.deleted. 

ticketController

4) Stats (server-main)
4.1 Stats de tickets
[x] curl http://localhost:3000/stats/tickets

5) Testes diretos no receiver (opcionais)
5.1 Enviar webhook direto (sem passar pelo main)
[x] curl -X POST http://localhost:4000/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "event":"manual.test",
    "data":{"ok":true},
    "sent_at":"2026-02-03T12:00:00Z"
  }'

5.2 Se estiveres a usar secret (troca o valor)
[x] curl -X POST http://localhost:4000/webhooks \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret:key" \
  -d '{"event":"manual.test","data":{"ok":true}}'
