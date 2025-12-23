import { injectable } from "inversify";
import winston from "winston";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class LoggerService implements ILogger {
  private _logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    ],
  });

  info(message: string, meta?: Record<string, unknown>) {
    this._logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this._logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this._logger.error(message, meta);
  }
}

export const logger = new LoggerService();
