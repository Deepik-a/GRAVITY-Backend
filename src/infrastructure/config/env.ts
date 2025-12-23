
import { z } from "zod";
import dotenv from "dotenv";
import { logger } from "../../domain/services/Logger.js";

// 1️⃣ .env → process.env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().transform(Number).default(5000),
  MONGO_URI: z.string().url(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
JWT_ACCESS_EXPIRATION: z.enum(["15m", "30m", "1h", "1d"]).default("15m"),
  JWT_REFRESH_EXPIRATION: z.enum(["7d", "14d", "30d"]).default("7d"),
  S3_URL_EXPIRATION: z.string().transform(Number).default(300),
  GOOGLE_CLIENT_ID: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY: z.string().min(1),
  AWS_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  logger.error("❌ Invalid environment variables:", {
    errors: z.treeifyError(_env.error),
  });
  process.exit(1);
}


export const env = _env.data;
