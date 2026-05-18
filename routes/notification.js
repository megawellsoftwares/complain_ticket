import { Router } from "express";
import { checkAuth } from "../middlewares/auth.js";
import { blockSuperadminMutation } from "../middlewares/superadminReadOnly.js";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead, markTicketNotificationsRead } from "../handlers/notification.js";

const notificationRouter = Router();
notificationRouter.use(checkAuth);
notificationRouter.use(blockSuperadminMutation);

notificationRouter.get("/", getMyNotifications);
notificationRouter.patch("/read-all", markAllNotificationsRead);
notificationRouter.patch("/ticket/:ticketId/read", markTicketNotificationsRead);
notificationRouter.patch("/:id/read", markNotificationRead);

export default notificationRouter;
