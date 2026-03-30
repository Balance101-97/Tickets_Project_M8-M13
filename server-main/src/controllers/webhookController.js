// server-main/src/controllers/webhookController.js
import * as webhookRepo from "../repositories/webhookRepo.js";
import { dispatchWebhookEvent } from "../services/webhookDispatcher.service.js";

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

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function listSubscriptions(req, res) {
  const subs = await webhookRepo.listSubscriptions();
  const data = subs.map((s) => ({
    ...s,
    events: (() => {
      try {
        return JSON.parse(s.events);
      } catch {
        return [];
      }
    })(),
  }));

  res.json({ data });
}

export async function createSubscription(req, res) {
  const { url, events } = req.body ?? {};

  if (!url || !isHttpUrl(String(url)))
    throw badRequest("Valid 'url' is required");
  if (!Array.isArray(events) || events.length === 0)
    throw badRequest("Valid 'events' array is required");

  const normalizedEvents = events.map((e) => String(e)).filter(Boolean);
  if (!normalizedEvents.length) throw badRequest("Events cannot be empty");

  const created = await webhookRepo.createSubscription({
    url: String(url),
    events: normalizedEvents,
  });

  res.status(201).json({
    data: {
      ...created,
      events: normalizedEvents,
    },
  });
}

export async function deleteSubscription(req, res) {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) throw badRequest("Invalid subscription id");

  const deleted = await webhookRepo.deleteSubscription(id);
  if (!deleted) throw notFound("Subscription not found");

  res.json({ data: deleted });
}
