import { injectable } from "inversify";
import winston from "winston";
import { ILogger } from "../../domain/services/ILogger";

@injectable()
export class LoggerService implements ILogger {
  private logger = winston.createLogger({
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

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
  }
}
