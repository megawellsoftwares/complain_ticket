import mongoose from "mongoose";
import "dotenv/config";
import userModel from "../models/users.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");
    const res = await userModel.updateMany({}, { $set: { isActive: true } });
    console.log(`Updated ${res.modifiedCount} users to active.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
