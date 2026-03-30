
// server-main/src/repositories/webhookRepo.js
import { dbAll, dbGet, dbRun } from "../db/index.js";

export async function listSubscriptions() {
  return dbAll(
    "SELECT id, url, events, created_at FROM webhook_subscriptions ORDER BY id DESC",
  );
}

export async function getSubscriptionById(id) {
  return dbGet(
    "SELECT id, url, events, created_at FROM webhook_subscriptions WHERE id = ?",
    [id],
  );
}

export async function createSubscription({ url, events }) {
  const result = await dbRun(
    `
    INSERT INTO webhook_subscriptions (url, events)
    VALUES (?, ?)
    `,
    [url, JSON.stringify(events)],
  );
  return getSubscriptionById(result.lastID);
}

export async function deleteSubscription(id) {
  const existing = await getSubscriptionById(id);
  if (!existing) return null;

  await dbRun("DELETE FROM webhook_subscriptions WHERE id = ?", [id]);
  return existing;
}


