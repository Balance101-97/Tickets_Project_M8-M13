

// server-main/src/routes/webhookRoutes.js
import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware.js";
import * as webhookController from "../controllers/webhookController.js";

const router = Router();

router.get("/subscriptions", asyncHandler(webhookController.listSubscriptions));
router.post("/subscriptions", asyncHandler(webhookController.createSubscription));
router.delete(
  "/subscriptions/:id",
  asyncHandler(webhookController.deleteSubscription),
);

// router.post("/test", asyncHandler(webhookController.testDispatch));

export default router;