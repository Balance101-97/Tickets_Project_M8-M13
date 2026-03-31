// server-main/src/services/webhookDispatcher.service.js
import { listSubscriptions } from "../repositories/webhookRepo.js";

export async function postJson(url, body, secret) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secret ? { "x-webhook-secret": secret } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Webhook POST failed: ${res.status} ${res.statusText}`);
    err.statusCode = 502;
    err.details = text;
    throw err;
  }
}

export function parseEvents(eventsStr) {
  try {
    const parsed = JSON.parse(eventsStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function dispatchWebhookEvent(event, payload) {
  const subs = await listSubscriptions();
  const targets = subs.filter((s) => parseEvents(s.events).includes(event));

  const attempted = targets.length;
  if (!attempted) return { delivered: 0, attempted: 0 };

  const sentAt = new Date().toISOString();
  const secret = process.env.WEBHOOK_SECRET || "";

  const body = { event, data: payload, sent_at: sentAt };

  const results = await Promise.allSettled(
    targets.map((s) => postJson(s.url, body, secret))
  );

  const delivered = results.filter((r) => r.status === "fulfilled").length;
  return { delivered, attempted };
}
