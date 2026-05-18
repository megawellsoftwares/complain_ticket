import { StatusCodes } from "http-status-codes";

export const notFoundHandler = (req, res, next) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === StatusCodes.OK ? StatusCodes.INTERNAL_SERVER_ERROR : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
