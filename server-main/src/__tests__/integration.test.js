import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";

import app from "../app.js";
import { connectDb, dbRun } from "../db/index.js";
import { migrate } from "../db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(__dirname, "../db/schema.sql");

// ─────────────────────────────────────────────────────────────
// SETUP GLOBAL
// Corre UMA VEZ antes de todos os testes:
// Liga uma BD SQLite em memória e cria as tabelas.
// ─────────────────────────────────────────────────────────────
beforeAll(async () => {
  await connectDb(":memory:");   // BD em memória — não toca na app.db real!
  await migrate(SCHEMA_PATH);    // cria as tabelas (tickets, webhook_subscriptions)
});

// Limpa os dados entre cada teste para que os testes não se influenciem.
beforeEach(async () => {
  await dbRun("DELETE FROM tickets");
  await dbRun("DELETE FROM webhook_subscriptions");
});

// ─────────────────────────────────────────────────────────────
// /health
// ─────────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("responde 200 com status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe(true);        // BD está ligada
    expect(res.body.time).toBeDefined();   // tem timestamp
  });
});

// ─────────────────────────────────────────────────────────────
// /tickets  — listar
// ─────────────────────────────────────────────────────────────
describe("GET /tickets", () => {
  it("devolve lista vazia quando não há tickets", async () => {
    const res = await request(app).get("/tickets");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.paging.total).toBe(0);
  });

  it("devolve os tickets criados", async () => {
    // Primeiro cria um ticket
    await request(app)
      .post("/tickets")
      .send({ CI_Name: "Servidor A", Open_Time: "2024-01-01" });

    const res = await request(app).get("/tickets");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].CI_Name).toBe("Servidor A");
    expect(res.body.paging.total).toBe(1);
  });

  it("aplica paginação com limit e offset", async () => {
    // Cria 3 tickets
    await request(app).post("/tickets").send({ CI_Name: "T1", Open_Time: "2024-01-01" });
    await request(app).post("/tickets").send({ CI_Name: "T2", Open_Time: "2024-01-02" });
    await request(app).post("/tickets").send({ CI_Name: "T3", Open_Time: "2024-01-03" });

    // Pede só 2 por página
    const res = await request(app).get("/tickets?limit=2&offset=0");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.paging.total).toBe(3); // total correto
  });

  it("filtra por status", async () => {
    await request(app).post("/tickets").send({ CI_Name: "T1", Status: "Open", Open_Time: "2024-01-01" });
    await request(app).post("/tickets").send({ CI_Name: "T2", Status: "Closed", Open_Time: "2024-01-02" });

    const res = await request(app).get("/tickets?status=Open");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].CI_Name).toBe("T1");
  });

  it("filtra por priority", async () => {
    await request(app).post("/tickets").send({ CI_Name: "Alta", Priority: "1", Open_Time: "2024-01-01" });
    await request(app).post("/tickets").send({ CI_Name: "Baixa", Priority: "3", Open_Time: "2024-01-02" });

    const res = await request(app).get("/tickets?priority=3");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].CI_Name).toBe("Baixa");
  });

  it("filtra por ci_name (pesquisa parcial)", async () => {
    await request(app).post("/tickets").send({ CI_Name: "Servidor Web", Open_Time: "2024-01-01" });
    await request(app).post("/tickets").send({ CI_Name: "Router Core", Open_Time: "2024-01-02" });

    const res = await request(app).get("/tickets?ci_name=Servidor");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].CI_Name).toBe("Servidor Web");
  });

  it("o limit máximo é 100 mesmo que se peça mais", async () => {
    const res = await request(app).get("/tickets?limit=999");

    expect(res.status).toBe(200);
    expect(res.body.paging.limit).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────
// /tickets/:id  — obter um ticket
// ─────────────────────────────────────────────────────────────
describe("GET /tickets/:id", () => {
  it("devolve o ticket correto pelo id", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "PC-01", CI_Cat: "Hardware", Open_Time: "2024-03-01" });

    const id = created.body.data.id;
    const res = await request(app).get(`/tickets/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.CI_Name).toBe("PC-01");
    expect(res.body.data.CI_Cat).toBe("Hardware");
  });

  it("responde 404 para id que não existe", async () => {
    const res = await request(app).get("/tickets/99999");

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });

  it("responde 400 para id inválido (não numérico)", async () => {
    const res = await request(app).get("/tickets/abc");

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// POST /tickets  — criar ticket
// ─────────────────────────────────────────────────────────────
describe("POST /tickets", () => {
  it("cria um ticket com todos os campos", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({
        CI_Name: "Servidor DB",
        CI_Cat: "Software",
        Status: "Open",
        Priority: "2",
        Open_Time: "2024-06-01",
        Close_Time: "2024-06-10",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.CI_Name).toBe("Servidor DB");
    expect(res.body.data.CI_Cat).toBe("Software");
    expect(res.body.data.Status).toBe("Open");
    expect(res.body.data.Priority).toBe("2");
    expect(res.body.data.id).toBeDefined();       // tem id atribuído
    expect(res.body.data.created_at).toBeDefined(); // tem timestamp
  });

  it("cria ticket com valores padrão quando campos opcionais não são enviados", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({ Open_Time: "2024-06-01" });

    expect(res.status).toBe(201);
    expect(res.body.data.Status).toBe("Work In Progress"); // default
    expect(res.body.data.Priority).toBe("1");              // default
    expect(res.body.data.CI_Name).toBe("");                // default
  });

  it("aceita campos em formato camelCase", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({ ciName: "Router X", openTime: "2024-06-01" });

    expect(res.status).toBe(201);
    expect(res.body.data.CI_Name).toBe("Router X");
  });

  it("responde 400 quando Open_Time não é enviado", async () => {
    const res = await request(app)
      .post("/tickets")
      .send({ CI_Name: "Servidor Sem Data" });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/Open_Time/i);
  });

  it("responde 400 com body vazio", async () => {
    const res = await request(app).post("/tickets").send({});

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// PATCH /tickets/:id  — atualizar ticket
// ─────────────────────────────────────────────────────────────
describe("PATCH /tickets/:id", () => {
  it("atualiza o status de um ticket", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "PC-10", Open_Time: "2024-01-01" });

    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/tickets/${id}`)
      .send({ Status: "Closed" });

    expect(res.status).toBe(200);
    expect(res.body.data.before.Status).not.toBe("Closed"); // estado anterior
    expect(res.body.data.after.Status).toBe("Closed");      // estado depois
  });

  it("a resposta inclui before e after", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "Switch", Priority: "1", Open_Time: "2024-01-01" });

    const id = created.body.data.id;

    const res = await request(app)
      .patch(`/tickets/${id}`)
      .send({ Priority: "3" });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("before");
    expect(res.body.data).toHaveProperty("after");
    expect(res.body.data.before.Priority).toBe("1");
    expect(res.body.data.after.Priority).toBe("3");
  });

  it("atualiza apenas os campos enviados, mantém os restantes", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "Firewall", CI_Cat: "Hardware", Open_Time: "2024-01-01" });

    const id = created.body.data.id;

    await request(app).patch(`/tickets/${id}`).send({ Status: "Open" });

    const res = await request(app).get(`/tickets/${id}`);

    expect(res.body.data.CI_Name).toBe("Firewall");   // não mudou
    expect(res.body.data.CI_Cat).toBe("Hardware");    // não mudou
    expect(res.body.data.Status).toBe("Open");        // mudou
  });

  it("responde 404 para id que não existe", async () => {
    const res = await request(app)
      .patch("/tickets/99999")
      .send({ Status: "Closed" });

    expect(res.status).toBe(404);
  });

  it("responde 400 para id inválido", async () => {
    const res = await request(app)
      .patch("/tickets/abc")
      .send({ Status: "Closed" });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// DELETE /tickets/:id  — apagar ticket
// ─────────────────────────────────────────────────────────────
describe("DELETE /tickets/:id", () => {
  it("apaga um ticket existente e devolve os dados apagados", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "Para Apagar", Open_Time: "2024-01-01" });

    const id = created.body.data.id;

    const res = await request(app).delete(`/tickets/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.CI_Name).toBe("Para Apagar");
  });

  it("após apagar, o ticket já não existe", async () => {
    const created = await request(app)
      .post("/tickets")
      .send({ CI_Name: "Efémero", Open_Time: "2024-01-01" });

    const id = created.body.data.id;

    await request(app).delete(`/tickets/${id}`);

    const res = await request(app).get(`/tickets/${id}`);
    expect(res.status).toBe(404);
  });

  it("responde 404 ao tentar apagar id que não existe", async () => {
    const res = await request(app).delete("/tickets/99999");

    expect(res.status).toBe(404);
  });

  it("responde 400 com id inválido", async () => {
    const res = await request(app).delete("/tickets/abc");

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// /webhooks/subscriptions  — gerir subscriptions
// ─────────────────────────────────────────────────────────────
describe("GET /webhooks/subscriptions", () => {
  it("devolve lista vazia quando não há subscriptions", async () => {
    const res = await request(app).get("/webhooks/subscriptions");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("devolve subscriptions criadas com events já em array", async () => {
    await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "http://exemplo.com/hook", events: ["ticket.created"] });

    const res = await request(app).get("/webhooks/subscriptions");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(Array.isArray(res.body.data[0].events)).toBe(true); // events é array, não string JSON
    expect(res.body.data[0].events).toContain("ticket.created");
  });
});

describe("POST /webhooks/subscriptions", () => {
  it("cria uma subscription com url e events válidos", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({
        url: "https://meu-servidor.com/webhook",
        events: ["ticket.created", "ticket.updated"],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.url).toBe("https://meu-servidor.com/webhook");
    expect(res.body.data.events).toEqual(["ticket.created", "ticket.updated"]);
    expect(res.body.data.id).toBeDefined();
  });

  it("responde 400 com URL inválida", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "nao-e-url", events: ["ticket.created"] });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/url/i);
  });

  it("responde 400 com protocolo ftp", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "ftp://servidor.com/hook", events: ["ticket.created"] });

    expect(res.status).toBe(400);
  });

  it("responde 400 com events array vazio", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "http://servidor.com/hook", events: [] });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/events/i);
  });

  it("responde 400 sem url no body", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({ events: ["ticket.created"] });

    expect(res.status).toBe(400);
  });

  it("responde 400 sem events no body", async () => {
    const res = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "http://servidor.com/hook" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /webhooks/subscriptions/:id", () => {
  it("apaga uma subscription existente", async () => {
    const created = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "http://apagar.com/hook", events: ["ticket.created"] });

    const id = created.body.data.id;

    const res = await request(app).delete(`/webhooks/subscriptions/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it("após apagar, subscription deixa de aparecer na listagem", async () => {
    const created = await request(app)
      .post("/webhooks/subscriptions")
      .send({ url: "http://temporario.com/hook", events: ["ticket.deleted"] });

    const id = created.body.data.id;

    await request(app).delete(`/webhooks/subscriptions/${id}`);

    const res = await request(app).get("/webhooks/subscriptions");
    const ids = res.body.data.map((s) => s.id);
    expect(ids).not.toContain(id);
  });

  it("responde 404 para id inexistente", async () => {
    const res = await request(app).delete("/webhooks/subscriptions/99999");

    expect(res.status).toBe(404);
  });

  it("responde 400 para id inválido", async () => {
    const res = await request(app).delete("/webhooks/subscriptions/abc");

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// Rotas desconhecidas
// ─────────────────────────────────────────────────────────────
describe("Rotas desconhecidas", () => {
  it("responde 404 para rota que não existe", async () => {
    const res = await request(app).get("/rota-que-nao-existe");

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found/i);
  });
});
