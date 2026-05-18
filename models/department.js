import { model, Schema } from "mongoose";

const departmentSchema = new Schema({
  name: { type: String, required: true, unique: true },
});

const DepartmentModel = model("department", departmentSchema);
export default DepartmentModel;
