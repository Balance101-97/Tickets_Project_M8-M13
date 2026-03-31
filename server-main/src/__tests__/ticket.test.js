import { describe, it, expect } from "@jest/globals";
import {
  parseIntParam,
  normalizeTicketInput,
  badRequest,
  notFound,
} from "../controllers/ticketController.js";

import { isHttpUrl } from "../controllers/webhookController.js";
import { parseEvents } from "../services/webhookDispatcher.service.js";
import { pick } from "../services/csvImport.service.js";

// ─────────────────────────────────────────────────────────────
// parseIntParam
// ─────────────────────────────────────────────────────────────
describe("parseIntParam", () => {
  // --- casos normais ---
  it("converte uma string numérica positiva", () => {
    expect(parseIntParam("5", 0)).toBe(5);
  });

  it("converte uma string numérica negativa", () => {
    expect(parseIntParam("-3", 0)).toBe(-3);
  });

  it("converte o número zero (não usa fallback)", () => {
    expect(parseIntParam("0", 99)).toBe(0);
  });

  it("trunca casas decimais como parseInt faz", () => {
    expect(parseIntParam("3.9", 0)).toBe(3);
  });

  it("funciona com número já passado como number (não string)", () => {
    expect(parseIntParam(10, 0)).toBe(10);
  });

  // --- fallback ---
  it("devolve fallback com string não numérica", () => {
    expect(parseIntParam("abc", 99)).toBe(99);
  });

  it("devolve fallback com string vazia", () => {
    expect(parseIntParam("", 42)).toBe(42);
  });

  it("devolve fallback com null", () => {
    expect(parseIntParam(null, 7)).toBe(7);
  });

  it("devolve fallback com undefined", () => {
    expect(parseIntParam(undefined, 7)).toBe(7);
  });

  it("devolve fallback com NaN explícito", () => {
    expect(parseIntParam(NaN, 5)).toBe(5);
  });

  it("devolve fallback com objeto", () => {
    expect(parseIntParam({}, 3)).toBe(3);
  });

  it("devolve fallback com array vazio", () => {
    expect(parseIntParam([], 3)).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────
// normalizeTicketInput
// ─────────────────────────────────────────────────────────────
describe("normalizeTicketInput", () => {
  // --- formato CI_Name (maiúsculas, como vem do CSV) ---
  it("aceita CI_Name em maiúsculas", () => {
    const result = normalizeTicketInput({ CI_Name: "Servidor A" });
    expect(result.ciName).toBe("Servidor A");
  });

  it("aceita CI_Cat em maiúsculas", () => {
    const result = normalizeTicketInput({ CI_Cat: "Hardware" });
    expect(result.ciCat).toBe("Hardware");
  });

  it("aceita Status em maiúsculas", () => {
    const result = normalizeTicketInput({ Status: "Open" });
    expect(result.status).toBe("Open");
  });

  it("aceita Priority em maiúsculas", () => {
    const result = normalizeTicketInput({ Priority: "2" });
    expect(result.priority).toBe("2");
  });

  it("aceita Open_Time e Close_Time em maiúsculas", () => {
    const result = normalizeTicketInput({
      Open_Time: "2024-01-01",
      Close_Time: "2024-01-02",
    });
    expect(result.openTime).toBe("2024-01-01");
    expect(result.closeTime).toBe("2024-01-02");
  });

  // --- formato ci_name (lowercase) ---
  it("aceita ci_name em lowercase", () => {
    const result = normalizeTicketInput({ ci_name: "Router B" });
    expect(result.ciName).toBe("Router B");
  });

  it("aceita ci_cat em lowercase", () => {
    const result = normalizeTicketInput({ ci_cat: "Software" });
    expect(result.ciCat).toBe("Software");
  });

  it("aceita open_time e close_time em lowercase", () => {
    const result = normalizeTicketInput({
      open_time: "2024-03-01",
      close_time: "2024-03-05",
    });
    expect(result.openTime).toBe("2024-03-01");
    expect(result.closeTime).toBe("2024-03-05");
  });

  // --- formato camelCase ---
  it("aceita ciName em camelCase", () => {
    const result = normalizeTicketInput({ ciName: "PC-42" });
    expect(result.ciName).toBe("PC-42");
  });

  it("aceita status em camelCase", () => {
    const result = normalizeTicketInput({ status: "Closed" });
    expect(result.status).toBe("Closed");
  });

  it("aceita priority em camelCase", () => {
    const result = normalizeTicketInput({ priority: "3" });
    expect(result.priority).toBe("3");
  });

  // --- prioridade entre formatos (o código usa ?? então CI_Name ganha sobre ci_name) ---
  it("CI_Name tem prioridade sobre ci_name e ciName", () => {
    const result = normalizeTicketInput({
      CI_Name: "Primeiro",
      ci_name: "Segundo",
      ciName: "Terceiro",
    });
    expect(result.ciName).toBe("Primeiro");
  });

  it("ci_name tem prioridade sobre ciName quando CI_Name não existe", () => {
    const result = normalizeTicketInput({
      ci_name: "Segundo",
      ciName: "Terceiro",
    });
    expect(result.ciName).toBe("Segundo");
  });

  // --- campos em falta ---
  it("devolve undefined para campos que não existem no body", () => {
    const result = normalizeTicketInput({});
    expect(result.ciName).toBeUndefined();
    expect(result.ciCat).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.priority).toBeUndefined();
    expect(result.openTime).toBeUndefined();
    expect(result.closeTime).toBeUndefined();
  });

  // --- estrutura do resultado ---
  it("devolve sempre um objeto com as 6 chaves", () => {
    const result = normalizeTicketInput({ CI_Name: "X" });
    expect(result).toHaveProperty("ciName");
    expect(result).toHaveProperty("ciCat");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("priority");
    expect(result).toHaveProperty("openTime");
    expect(result).toHaveProperty("closeTime");
  });

  it("não adiciona chaves extra ao resultado", () => {
    const result = normalizeTicketInput({ CI_Name: "X", campoExtra: "Y" });
    expect(Object.keys(result)).toHaveLength(6);
  });
});

// ─────────────────────────────────────────────────────────────
// badRequest
// ─────────────────────────────────────────────────────────────
describe("badRequest", () => {
  it("cria um Error com a mensagem certa", () => {
    const err = badRequest("Campo obrigatório");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Campo obrigatório");
  });

  it("define statusCode como 400", () => {
    const err = badRequest("Erro de validação");
    expect(err.statusCode).toBe(400);
  });

  it("funciona com mensagem vazia", () => {
    const err = badRequest("");
    expect(err.message).toBe("");
    expect(err.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────
// notFound
// ─────────────────────────────────────────────────────────────
describe("notFound", () => {
  it("cria um Error com a mensagem certa", () => {
    const err = notFound("Ticket não encontrado");
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Ticket não encontrado");
  });

  it("define statusCode como 404", () => {
    const err = notFound("Recurso inexistente");
    expect(err.statusCode).toBe(404);
  });

  it("statusCode de notFound é diferente de badRequest", () => {
    const err400 = badRequest("mau");
    const err404 = notFound("não existe");
    expect(err400.statusCode).not.toBe(err404.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────
// isHttpUrl  (webhookController)
// ─────────────────────────────────────────────────────────────
describe("isHttpUrl", () => {
  // --- URLs válidas ---
  it("aceita URL com protocolo http", () => {
    expect(isHttpUrl("http://exemplo.com")).toBe(true);
  });

  it("aceita URL com protocolo https", () => {
    expect(isHttpUrl("https://exemplo.com/webhook")).toBe(true);
  });

  it("aceita URL com porta explícita", () => {
    expect(isHttpUrl("http://localhost:3000/callback")).toBe(true);
  });

  it("aceita URL com query string", () => {
    expect(isHttpUrl("https://api.exemplo.com/hook?token=abc")).toBe(true);
  });

  it("aceita URL localhost https", () => {
    expect(isHttpUrl("https://localhost/endpoint")).toBe(true);
  });

  // --- URLs inválidas ---
  it("rejeita protocolo ftp", () => {
    expect(isHttpUrl("ftp://ficheiros.com")).toBe(false);
  });

  it("rejeita protocolo mailto", () => {
    expect(isHttpUrl("mailto:alguem@email.com")).toBe(false);
  });

  it("rejeita string sem protocolo", () => {
    expect(isHttpUrl("exemplo.com/webhook")).toBe(false);
  });

  it("rejeita string aleatória", () => {
    expect(isHttpUrl("isto nao e url")).toBe(false);
  });

  it("rejeita string vazia", () => {
    expect(isHttpUrl("")).toBe(false);
  });

  it("rejeita número", () => {
    expect(isHttpUrl(12345)).toBe(false);
  });

  it("rejeita null", () => {
    expect(isHttpUrl(null)).toBe(false);
  });

  it("rejeita undefined", () => {
    expect(isHttpUrl(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// parseEvents  (webhookDispatcher.service)
// ─────────────────────────────────────────────────────────────
describe("parseEvents", () => {
  // --- casos válidos ---
  it("faz parse de um array com um evento", () => {
    expect(parseEvents('["ticket.created"]')).toEqual(["ticket.created"]);
  });

  it("faz parse de um array com múltiplos eventos", () => {
    expect(
      parseEvents('["ticket.created","ticket.updated","ticket.deleted"]')
    ).toEqual(["ticket.created", "ticket.updated", "ticket.deleted"]);
  });

  it("devolve array vazio para array JSON vazio", () => {
    expect(parseEvents("[]")).toEqual([]);
  });

  // --- casos inválidos ---
  it("devolve array vazio se o JSON é inválido", () => {
    expect(parseEvents("isto nao e json")).toEqual([]);
  });

  it("devolve array vazio se o resultado é um objeto (não array)", () => {
    expect(parseEvents('{"event":"ticket.created"}')).toEqual([]);
  });

  it("devolve array vazio se o resultado é uma string JSON", () => {
    expect(parseEvents('"ticket.created"')).toEqual([]);
  });

  it("devolve array vazio se o resultado é um número JSON", () => {
    expect(parseEvents("42")).toEqual([]);
  });

  it("devolve array vazio com string vazia", () => {
    expect(parseEvents("")).toEqual([]);
  });

  it("devolve array vazio com null", () => {
    expect(parseEvents(null)).toEqual([]);
  });

  it("devolve array vazio com undefined", () => {
    expect(parseEvents(undefined)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// pick  (csvImport.service)
// ─────────────────────────────────────────────────────────────
describe("pick", () => {
  // --- primeira chave encontrada ---
  it("devolve o valor da primeira chave que existe", () => {
    expect(pick({ CI_Name: "Servidor" }, "CI_Name", "ci_name")).toBe(
      "Servidor"
    );
  });

  it("passa para a segunda chave se a primeira não existe", () => {
    expect(pick({ ci_name: "Router" }, "CI_Name", "ci_name")).toBe("Router");
  });

  it("passa para a terceira chave se as duas primeiras não existem", () => {
    expect(
      pick({ priority: "2" }, "Priority", "PRIORITY", "priority")
    ).toBe("2");
  });

  // --- casos com undefined e null ---
  it("ignora chave cujo valor é undefined", () => {
    expect(pick({ CI_Name: undefined, ci_name: "Backup" }, "CI_Name", "ci_name")).toBe(
      "Backup"
    );
  });

  it("ignora chave cujo valor é null", () => {
    expect(pick({ CI_Name: null, ci_name: "Firewall" }, "CI_Name", "ci_name")).toBe(
      "Firewall"
    );
  });

  it("devolve undefined se nenhuma chave existe no objeto", () => {
    expect(pick({ outro: "X" }, "CI_Name", "ci_name")).toBeUndefined();
  });

  it("devolve undefined com objeto vazio", () => {
    expect(pick({}, "CI_Name")).toBeUndefined();
  });

  // --- tipos de valor ---
  it("funciona com valor numérico", () => {
    expect(pick({ Priority: 3 }, "Priority")).toBe(3);
  });

  it("funciona com valor string vazia (considera-a válida)", () => {
    expect(pick({ CI_Name: "" }, "CI_Name", "ci_name")).toBe("");
  });

  it("funciona com valor false (considera-o válido)", () => {
    expect(pick({ active: false }, "active")).toBe(false);
  });

  it("funciona com valor zero (considera-o válido)", () => {
    expect(pick({ count: 0 }, "count")).toBe(0);
  });
});