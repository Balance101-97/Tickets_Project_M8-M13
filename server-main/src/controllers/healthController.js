import { dbGet } from "../db/index.js";

export async function healthCheck(req, res) {
  const row = await dbGet("SELECT 1 AS ok");
  res.json({
    status: "ok",
    db: row?.ok === 1,
    time: new Date().toISOString(),
  });
}