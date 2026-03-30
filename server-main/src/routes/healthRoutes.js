import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware.js";
import { healthCheck } from "../controllers/healthController.js";

const router = Router();

router.get("/", asyncHandler(healthCheck));

export default router;