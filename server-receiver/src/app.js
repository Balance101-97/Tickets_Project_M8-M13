import express from "express";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

app.use(express.json());

app.use("/webhooks", webhookRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
