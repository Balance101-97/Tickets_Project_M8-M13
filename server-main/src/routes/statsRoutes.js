// server-main/src/routes/statsRoutes.js
import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware.js";
import { ticketStats } from "../controllers/statsController.js";

const router = Router();

router.get("/tickets", asyncHandler(ticketStats));

export default router;

