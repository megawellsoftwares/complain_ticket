import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import authRouter from "./routes/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import userRouter from "./routes/user.js";
import departmentRouter from "./routes/department.js";
import ticketRouter from "./routes/ticket.js";
import problemRouter from "./routes/problem.js";
import notificationRouter from "./routes/notification.js";
import statsRouter from "./routes/stats.js";

const app = express();

app.set("trust proxy", true);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/department", departmentRouter);
app.use("/ticket", ticketRouter);
app.use("/uploads", express.static("uploads"));
app.use("/issue", problemRouter);
app.use("/notification", notificationRouter);
app.use("/stats", statsRouter);

// not found
app.use(notFoundHandler);

// error handling
app.use(errorHandler);
export default app;
