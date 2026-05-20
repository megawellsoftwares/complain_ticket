import http from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import userModel from "./models/users.js";

const PORT = process.env.PORT || 4004;

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // expose io on app for handlers to emit
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));

    // Join rooms after client authenticates - client should send a token
    socket.on("auth:join", async (data) => {
      try {
        const token = data?.token;
        if (!token) return;
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.AUTH_SECRET);
        } catch (e) {
          console.warn("Invalid token on socket auth:join", e.message);
          return;
        }
        const user = await userModel.findById(decoded._id).lean();
        if (!user) return;
        const userId = user._id.toString();
        const role = user.role;
        const department = user.department ? (user.department._id ? user.department._id.toString() : user.department.toString()) : null;
        if (userId) socket.join(`user:${userId}`);
        if (role) socket.join(`role:${role}`);
        if (department) socket.join(`dept:${department}`);
        console.log(`Socket ${socket.id} joined rooms for user ${userId} role ${role} dept ${department}`);
      } catch (e) {
        console.error("Error on auth:join", e);
      }
    });
  });

  server.listen(PORT, () => {
    console.log(`Server + sockets running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
