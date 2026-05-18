import mongoose, { model, Schema } from "mongoose";

const problemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "problem name is required"],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "department",
      required: true
    },
    /** low = requesters may open tickets; high = only department responsible (or admin) */
    tier: {
      type: String,
      enum: ["low", "high"],
      default: "low",
    },
  },
  { timestamps: true }
);

const problemModel = model("problem", problemSchema);
export default problemModel;
