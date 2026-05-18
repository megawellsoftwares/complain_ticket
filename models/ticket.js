import mongoose, { model, Schema } from "mongoose";

const ticketSchema = new Schema(
  {
    ticketId: {
      type: String,
      unique: true
    },
    priority: {
      type: String,
      enum: ["low", "high"],
      required: true,
      default: "low"
    },
    voicePath: {
      type: String,
      required: [true, "Vocal recording path is required"]
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true
    },


    subProblem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subproblem",
      required: true
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    },

    status: {
      type: String,
      enum: [
        "received", "seen", "dispatched", "seen-agent", "in-progress", "solved", "closed",
        "assigned", "resolved", "seen-supervisor", "pending-confirmation", "fermer",
      ],
    },
    isUpdated: {
      type: Boolean,
      default: false
    },
    isCanceled: {
      type: Boolean,
      default: false
    },
    isReopened: {
      type: Boolean,
      default: false
    },
    /** When agent escalates: supervisor sees ticket in queue; requester still sees "in-progress" */
    needsSupervisorReassign: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function () {
  if (this.isNew && !this.ticketId) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let id = '';
    let exists = true;
    while(exists) {
      id = '';
      for (let i = 0; i < 2; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      for (let i = 0; i < 3; i++) {
        id += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      const ticketExists = await this.constructor.findOne({ ticketId: id });
      if(!ticketExists) {
        exists = false;
      }
    }
    this.ticketId = id;
  }
});

const ticketModel = model("ticket", ticketSchema);
export default ticketModel;
