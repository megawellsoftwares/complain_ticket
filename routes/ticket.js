import { Router } from "express";
import {
  createTicket,
  getAllTickets,
  getUnassignedTickets,
  getMyTickets,
  getAgentTickets,
  assignTicket,
  updateTicketStatus,
  getTicketById,
  respondToResolution,
  agentCannotSolve,
  acceptTicket,
  supervisorStartTicket,
  getPendingResponsibleTickets,
  confirmResponsibleTicket,
  modifyResponsibleTicket,
  cancelResponsibleTicket,
} from "../handlers/ticket.js";
import { checkAuth } from "../middlewares/auth.js";
import { authorize } from "../middlewares/roles.js";
import { blockSuperadminMutation } from "../middlewares/superadminReadOnly.js";
import { uploadVoice } from "../middlewares/upload.js";

const ticketRouter = Router();

ticketRouter.use(checkAuth);
ticketRouter.use(blockSuperadminMutation);

ticketRouter.post("/accept", authorize("agent", "supervisor"), acceptTicket);
ticketRouter.post("/agent-cannot-solve", authorize("agent", "supervisor"), uploadVoice.single("voice"), agentCannotSolve);
ticketRouter.post("/", authorize("requester", "responsible", "admin", "agent", "supervisor"), uploadVoice.single("voice"), createTicket);
ticketRouter.get("/my", authorize("requester", "responsible", "agent", "supervisor"), getMyTickets);

ticketRouter.get("/pending-responsible", authorize("responsible", "admin"), getPendingResponsibleTickets);
ticketRouter.patch("/responsible/:id/confirm", authorize("responsible", "admin"), confirmResponsibleTicket);
ticketRouter.patch("/responsible/:id/modify", authorize("responsible", "admin"), uploadVoice.single("voice"), modifyResponsibleTicket);
ticketRouter.patch("/responsible/:id/cancel", authorize("responsible", "admin"), cancelResponsibleTicket);

ticketRouter.get("/assigned", authorize("agent"), getAgentTickets);

ticketRouter.post("/supervisor-start", authorize("supervisor"), supervisorStartTicket);

ticketRouter.get("/all", authorize("supervisor", "admin", "superadmin"), getAllTickets);
ticketRouter.get("/unassigned", authorize("supervisor", "admin", "superadmin"), getUnassignedTickets);
ticketRouter.patch("/assign", authorize("supervisor", "admin"), assignTicket);

ticketRouter.get("/:id", getTicketById);
ticketRouter.patch("/status", authorize("agent", "supervisor", "admin"), updateTicketStatus);
ticketRouter.post("/respond-resolution", authorize("requester", "responsible", "agent", "supervisor"), uploadVoice.single("voice"), respondToResolution);

export default ticketRouter;
