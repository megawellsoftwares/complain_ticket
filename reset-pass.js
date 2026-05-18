import mongoose from "mongoose";
import bcrypt from "bcrypt";
import "dotenv/config";

mongoose.connect("mongodb://127.0.0.1:27017/Complaine-sys-db").then(async () => {
  const hash = await bcrypt.hash("123456", 10);
  await mongoose.connection.db.collection("users").updateOne(
    { email: "admin@gmail.com" },
    { $set: { password: hash } }
  );
  console.log("Password reset successfully");
  process.exit(0);
}).catch(console.error);
