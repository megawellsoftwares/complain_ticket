import mongoose, { model, Schema } from "mongoose";

const ticketHistorySchema = new Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ticket",
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: [
        "created", "received", "seen", "assigned", "accepted", "in-progress", "resolved", "closed", "reopened", "escalated",
        "seen-supervisor", "dispatched", "seen-agent", "pending-confirmation", "fermer",
        "solved",
        "confirmed", "modified", "canceled",
      ],
      required: true
    },
    fromStatus: String,
    toStatus: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    note: String,
    voicePath: String
  },
  { timestamps: true }
);

const ticketHistoryModel = model("tickethistory", ticketHistorySchema);
export default ticketHistoryModel;
