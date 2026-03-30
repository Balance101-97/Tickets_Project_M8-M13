
// server-main/src/repositories/ticketRepo.js
import { dbAll, dbGet, dbRun } from "../db/index.js";

const TICKET_COLUMNS = [
  "id",
  "CI_Name",
  "CI_Cat",
  "Status",
  "Priority",
  "Open_Time",
  "Close_Time",
  "created_at",
  "updated_at",
];

function toTicketRow(row) {
  if (!row) return null;
  return row;
}

export async function listTickets(filters) {
  const { status, priority, ciName, limit, offset, sortBy, sortDir } = filters;

  const where = [];
  const params = [];

  if (status) {
    where.push("Status = ?");
    params.push(status);
  }
  if (priority) {
    where.push("Priority = ?");
    params.push(priority);
  }
  if (ciName) {
    where.push("CI_Name LIKE ?");
    params.push(`%${ciName}%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const safeSortBy = TICKET_COLUMNS.includes(sortBy) ? sortBy : "id";
  const safeSortDir = sortDir === "asc" ? "ASC" : "DESC";

  const countRow = await dbGet(
    `SELECT COUNT(*) AS total FROM tickets ${whereSql}`,
    params,
  );

  const rows = await dbAll(
    `
    SELECT ${TICKET_COLUMNS.join(", ")}
    FROM tickets
    ${whereSql}
    ORDER BY ${safeSortBy} ${safeSortDir}
    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset],
  );

  return {
    total: countRow?.total ?? 0,
    rows: rows.map(toTicketRow),
  };
}

export async function getTicketById(id) {
  const row = await dbGet(
    `SELECT ${TICKET_COLUMNS.join(", ")} FROM tickets WHERE id = ?`,
    [id],
  );
  return toTicketRow(row);
}

export async function createTicket(data) {
  const { ciName, ciCat, status, priority, openTime, closeTime } = data;

  const result = await dbRun(
    `
    INSERT INTO tickets
    (CI_Name, CI_Cat, Status, Priority, Open_Time, Close_Time, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    [
      ciName ?? "",
      ciCat ?? "",
      status ?? "Work In Progress",
      priority ?? "1",
      openTime,
      closeTime ?? null,
    ],
  );

  return getTicketById(result.lastID);
}

export async function updateTicket(id, patch) {
  const allowed = {
    CI_Name: patch.ciName,
    CI_Cat: patch.ciCat,
    Status: patch.status,
    Priority: patch.priority,
    Open_Time: patch.openTime,
    Close_Time: patch.closeTime,
  };

  const sets = [];
  const params = [];

  for (const [col, value] of Object.entries(allowed)) {
    if (value === undefined) continue;
    sets.push(`${col} = ?`);
    params.push(value);
  }

  if (!sets.length) return getTicketById(id);

  sets.push("updated_at = datetime('now')");

  await dbRun(
    `
    UPDATE tickets
    SET ${sets.join(", ")}
    WHERE id = ?
    `,
    [...params, id],
  );

  return getTicketById(id);
}

export async function deleteTicket(id) {
  const existing = await getTicketById(id);
  if (!existing) return null;

  await dbRun("DELETE FROM tickets WHERE id = ?", [id]);
  return existing;
}


