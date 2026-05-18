import { StatusCodes } from "http-status-codes";

/** Blocks POST/PUT/PATCH/DELETE for role superadmin (read-only auditors). */
export function blockSuperadminMutation(req, res, next) {
  if (req.user?.role === "superadmin" && ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Super-admin accounts are read-only.",
    });
  }
  next();
}
