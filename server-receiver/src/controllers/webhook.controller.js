export async function receiveWebhook(req, res) {
  const secret = req.headers["x-webhook-secret"];
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  const event = req.body;

  // Se for update e vier com before/after, imprime bonito
  if (event?.event === "ticket.updated" && event?.data?.before && event?.data?.after) {
    console.log("Webhook recebido: ticket.updated");
    console.log("BEFORE:");
    console.log(JSON.stringify(event.data.before, null, 2));
    console.log("AFTER:");
    console.log(JSON.stringify(event.data.after, null, 2));
  } else {
    // fallback: log normal
    console.log("Webhook recebido:");
    console.log(JSON.stringify(event, null, 2));
  }

  res.status(200).json({ received: true });
}
