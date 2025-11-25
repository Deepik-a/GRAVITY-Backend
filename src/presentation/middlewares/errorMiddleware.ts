import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../../domain/enums/StatusCode";

 export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error caught by middleware:", err);
  if (err instanceof Error) {
    // Known application error
    res.status(StatusCode.BAD_REQUEST).json({ error: err.message });
  } else {
    // Unexpected or unknown error
    res.status(StatusCode.INTERNAL_ERROR).json({ error: "Unexpected error occurred" });
  }
}
