import mongoose from "mongoose";

mongoose.set("debug", true);

export async function connectDB() {
  return mongoose
    .connect(process.env.MONGODB_URI, {
      auth: {
        username: process.env.MONGODB_USERNAME,
        password: process.env.MONGODB_PASSWORD,
      },
      dbName: process.env.MONGODB_DB_NAME,
    })
    .then(() => console.log("Mongodb Connected !"))
    .catch((err) => console.error("Mongodb connection error:", err));
}
