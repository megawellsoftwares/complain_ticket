import mongoose from "mongoose";
import "dotenv/config";
import userModel from "../models/users.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const users = await userModel.find({}, "userName email role isActive");
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
