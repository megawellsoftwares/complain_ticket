import { StatusCodes } from "http-status-codes";

import userModel from "../models/users.js";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  const { email, password } = req.body;
  console.log(email);
  try {
    const user = await userModel.findOne({ email: email });
    if (!user) throw new Error("Wrong email/password");

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) throw new Error("Wrong email/password");

    if (String(user.isActive) !== "true" && user.role !== "superadmin") {
      throw new Error("Your account is pending activation by an administrator.");
    }
    const userInfo = {
      _id: user._id,
      role: user.role,
      createdAt: new Date(),
    };

    const token = jwt.sign(userInfo, process.env.AUTH_SECRET);

    user.password = undefined;

    res.status(StatusCodes.OK).json({
      success: true,
      data: user,
      token,
      message: "You have logged in successfully !",
    });
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: error?.message || "Login failed",
      error: error?.message || error,
    });
  }
}

export function checkUser(req, res) {
  const user = req.user;
  if (!user) throw new Error("User not Found.");
  res.status(StatusCodes.OK).json({
    success: true,
    data: user,
    message: "User is Authenticated",
  });
}
