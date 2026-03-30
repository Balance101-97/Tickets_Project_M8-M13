import { dbAll } from "../db/index.js";

// Node 18+ tem fetch global. Se não tiveres, diz-me e metemos node-fetch.
export async function emitWebhook(eventName, payload) {
  const secret = process.env.WEBHOOK_SECRET || "";

  // Buscar subscriptions que contem este evento no JSON "events"
  // Ex: events = ["ticket.created","ticket.updated"]
  const subs = await dbAll(
    `SELECT id, url, events FROM webhook_subscriptions`
  );

  const interested = subs.filter((s) => {
    try {
      const events = JSON.parse(s.events);
      return Array.isArray(events) && events.includes(eventName);
    } catch {
      return false;
    }
  });

  const body = {
    event: eventName,
    data: payload,
    sent_at: new Date().toISOString(),
  };

  // Fire-and-forget, mas sem quebrar o request atual:
  // enviamos em paralelo e ignoramos falhas (por agora).
  await Promise.allSettled(
    interested.map((s) =>
      fetch(s.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "x-webhook-secret": secret } : {}),
        },
        body: JSON.stringify(body),
      })
    )
  );
}
