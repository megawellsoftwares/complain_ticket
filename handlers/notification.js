import { StatusCodes } from "http-status-codes";
import notificationModel from "../models/notification.js";

export async function getMyNotifications(req, res) {
  try {
    const items = await notificationModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(80)
      .lean();
    res.status(StatusCodes.OK).json({ success: true, data: items });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const n = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true },
    );
    if (!n) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Notification not found" });
    }
    res.status(StatusCodes.OK).json({ success: true, data: n });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await notificationModel.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(StatusCodes.OK).json({ success: true, message: "All marked read" });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}
export async function markTicketNotificationsRead(req, res) {
  try {
    await notificationModel.updateMany(
      { user: req.user._id, ticket: req.params.ticketId, read: false },
      { read: true }
    );
    res.status(StatusCodes.OK).json({ success: true });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: error.message });
  }
}
