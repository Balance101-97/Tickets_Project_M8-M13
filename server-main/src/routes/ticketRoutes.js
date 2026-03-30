// server-main/src/routes/ticketRoutes.js
import { Router } from "express";
import { asyncHandler } from "../middlewares/errorMiddleware.js";
import * as ticketController from "../controllers/ticketController.js";

const router = Router();

router.get("/", asyncHandler(ticketController.listTickets));
router.get("/:id", asyncHandler(ticketController.getTicket));
router.post("/", asyncHandler(ticketController.createTicket));
router.patch("/:id", asyncHandler(ticketController.patchTicket));
router.delete("/:id", asyncHandler(ticketController.deleteTicket));

export default router;

