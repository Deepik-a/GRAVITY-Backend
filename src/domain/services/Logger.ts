import { injectable } from "inversify";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class LoggerService implements ILogger {
  private _logger: winston.Logger;

  constructor() {
    // 🔁 Daily rotating file for errors
    const errorRotateTransport = new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      maxFiles: "14d", // 🧹 Retention Period: 14 days
      zippedArchive: true, // optional: compress old logs
    });

    // 🔁 Daily rotating file for all logs
    const combinedRotateTransport = new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "info",
      maxFiles: "14d", // 🧹 Retention Period: 14 days
      zippedArchive: true,
    });

    this._logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        errorRotateTransport,
        combinedRotateTransport,
      ],
    });
  }

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
