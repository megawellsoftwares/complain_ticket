import notificationModel from "../models/notification.js";

/**
 * @param {import("mongoose").Types.ObjectId[]} userIds
 * @param {{ title: string; body?: string; ticketId?: import("mongoose").Types.ObjectId; type?: string }} payload
 */
export async function notifyUsers(userIds, payload) {
  const ids = [...new Set((userIds || []).filter(Boolean).map((id) => id.toString()))];
  if (!ids.length) return;
  const docs = ids.map((user) => ({
    user,
    title: payload.title,
    body: payload.body || "",
    ticket: payload.ticketId,
    type: payload.type || "info",
    read: false,
  }));
  await notificationModel.insertMany(docs);
}
