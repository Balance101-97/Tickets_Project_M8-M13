import fs from "fs";
import { parse } from "csv-parse/sync";
import { dbRun } from "../db/index.js";

function pick(row, ...keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return undefined;
}

export async function importTicketsFromCsv(csvPath) {
  const content = fs.readFileSync(csvPath, "utf8");
  const records = parse(content, { columns: true, skip_empty_lines: true });

  for (const r of records) {
    const ciName = pick(r, "CI_Name", "ci_name");
    const ciCat = pick(r, "CI_Cat", "ci_cat");
    const status = pick(r, "Status", "status") ?? "Work In Progress";
    const priority = String(pick(r, "Priority", "priority") ?? "1");
    const openTime = pick(r, "Open_Time", "open_time");
    const closeTime = pick(r, "Close_Time", "close_time") ?? null;

    if (!openTime) continue;

    await dbRun(
      `
      INSERT INTO tickets
      (CI_Name, CI_Cat, Status, Priority, Open_Time, Close_Time, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `,
      [ciName ?? "", ciCat ?? "", status, priority, openTime, closeTime],
    );
  }
}