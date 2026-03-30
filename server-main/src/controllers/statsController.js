
// server-main/src/controllers/statsController.js
import { dbAll, dbGet } from "../db/index.js";

export async function ticketStats(req, res) {
  const byStatus = await dbAll(
    "SELECT Status AS status, COUNT(*) AS count FROM tickets GROUP BY Status ORDER BY count DESC",
  );

  const byPriority = await dbAll(
    "SELECT Priority AS priority, COUNT(*) AS count FROM tickets GROUP BY Priority ORDER BY count DESC",
  );

  const totals = await dbGet(`
  SELECT
    COUNT(*) AS total,

    SUM(
      CASE
        WHEN NULLIF(Close_Time,'') IS NULL THEN 1
        ELSE 0
      END
    ) AS open,

    SUM(
      CASE
        WHEN NULLIF(Close_Time,'') IS NOT NULL THEN 1
        ELSE 0
      END
    ) AS closed

  FROM tickets
`);


  res.json({
    data: {
      totals: {
        total: totals?.total ?? 0,
        open: totals?.open ?? 0,
        closed: totals?.closed ?? 0,
      },
      by_status: byStatus,
      by_priority: byPriority,
    },
  });
}
