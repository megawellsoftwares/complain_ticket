import mongoose, { model, Schema } from "mongoose";

const notificationSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "ticket" },
    read: { type: Boolean, default: false },
    type: { type: String, default: "info" },
  },
  { timestamps: true },
);

export default model("notification", notificationSchema);
