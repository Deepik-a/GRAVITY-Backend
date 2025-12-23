import { Request, Response, NextFunction } from "express";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction 
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof Error) {
    return res.status(StatusCode.BAD_REQUEST).json({
      message: err.message,
    });
  }

  return res.status(StatusCode.INTERNAL_ERROR).json({
    message: "Internal server error",
  });
}