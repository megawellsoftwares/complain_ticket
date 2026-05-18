import { StatusCodes } from "http-status-codes";

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Forbidden: ${roles.join(" or ")} access only`,
      });
    }

    next();
  };
};
