import { Request, Response, NextFunction } from "express";

 export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error caught by middleware:", err);
  if (err instanceof Error) {
    // Known application error
    res.status(400).json({ error: err.message });
  } else {
    // Unexpected or unknown error
    res.status(500).json({ error: "Unexpected error occurred" });
  }
}
