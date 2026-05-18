import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const emails = [
  "requester01@gmail.com",
  "responsible01@gmail.com",
  "supervisor01@gmail.com",
  "agent01@gmail.com",
];

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const hash = await bcrypt.hash("123456", 10);
for (const email of emails) {
  const r = await mongoose.connection.db.collection("users").updateOne(
    { email },
    { $set: { password: hash, isActive: true } },
  );
  console.log(email, r.matchedCount ? "ok" : "missing");
}
process.exit(0);
