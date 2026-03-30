
// server-main/src/controllers/ticketController.js
import * as ticketRepo from "../repositories/ticketRepo.js";
import { dispatchWebhookEvent } from "../services/webhookDispatcher.service.js";

export function parseIntParam(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
}

export function normalizeTicketInput(body) {
  return {
    ciName: body.CI_Name ?? body.ci_name ?? body.ciName,
    ciCat: body.CI_Cat ?? body.ci_cat ?? body.ciCat,
    status: body.Status ?? body.status,
    priority: body.Priority ?? body.priority,
    openTime: body.Open_Time ?? body.open_time ?? body.openTime,
    closeTime: body.Close_Time ?? body.close_time ?? body.closeTime,
  };
}

export async function listTickets(req, res) {
  const limit = Math.min(parseIntParam(req.query.limit, 10), 100);
  const offset = Math.max(parseIntParam(req.query.offset, 0), 0);

  const { status, priority } = req.query;
  const ciName = req.query.ci_name ?? req.query.CI_Name ?? req.query.ciName;

  const sortBy = req.query.sort_by ?? req.query.sortBy ?? "id";
  const sortDir = String(
    req.query.sort_dir ?? req.query.sortDir ?? "asc",
  ).toLowerCase();

  const result = await ticketRepo.listTickets({
    status: status ? String(status) : null,
    priority: priority ? String(priority) : null,
    ciName: ciName ? String(ciName) : null,
    limit,
    offset,
    sortBy: String(sortBy),
    sortDir,
  });

  res.json({
    data: result.rows,
    paging: { total: result.total, limit, offset },
  });
}

export async function getTicket(req, res) {
  const id = parseIntParam(req.params.id, NaN);
  if (!Number.isFinite(id)) throw badRequest("Invalid ticket id");

  const ticket = await ticketRepo.getTicketById(id);
  if (!ticket) throw notFound("Ticket not found");

  res.json({ data: ticket });
}

export async function createTicket(req, res) {
  const input = normalizeTicketInput(req.body ?? {});
  if (!input.openTime) throw badRequest("Open_Time is required");

  const created = await ticketRepo.createTicket(input);
  await dispatchWebhookEvent("ticket.created", created).catch(() => null);

  res.status(201).json({ data: created });
}

export async function deleteTicket(req, res) {
  const id = parseIntParam(req.params.id, NaN);
  if (!Number.isFinite(id)) throw badRequest("Invalid ticket id");

  const deleted = await ticketRepo.deleteTicket(id);
  if (!deleted) throw notFound("Ticket not found");

  await dispatchWebhookEvent("ticket.deleted", deleted).catch(() => null);

  res.json({ data: deleted });
}
export async function patchTicket(req, res) {
  const id = parseIntParam(req.params.id, NaN);
  if (!Number.isFinite(id)) throw badRequest("Invalid ticket id");

  // 1) buscar "antes"
  const before = await ticketRepo.getTicketById(id);
  if (!before) throw notFound("Ticket not found");

  // 2) aplicar patch (devolve o "depois")
  const input = normalizeTicketInput(req.body ?? {});
  const after = await ticketRepo.updateTicket(id, input);

  // 3) enviar webhook com before/after
  await dispatchWebhookEvent("ticket.updated", { before, after }).catch(() => null);

  res.json({ data:  { before, after } });
}
