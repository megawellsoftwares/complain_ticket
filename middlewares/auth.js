import jwt from "jsonwebtoken";
import userModel from "../models/users.js";
import { StatusCodes } from "http-status-codes";

export async function checkAuth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) throw new Error("Token doesn't exist");

    const verified = jwt.verify(token, process.env.AUTH_SECRET);
    if (!verified) throw new Error("Unverified token used");

    const user = await userModel.findById(verified._id).select("-password");
    if (!user) throw new Error("User not found or deleted");

    req.user = user;
    next();
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Error in validating token",
      error,
    });
  }
}
