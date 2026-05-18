import mongoose, { model, Schema } from "mongoose";

const subProblemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "sub-problem name is required"],
      trim: true
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "problem",
      required: true
    },
  },
  { timestamps: true }
);

const subProblemModel = model("subproblem", subProblemSchema);
export default subProblemModel;
