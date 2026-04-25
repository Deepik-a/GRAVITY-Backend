import { env } from "@/infrastructure/config/env";

export const cookieData = {
  httpONLY: true,
  SECURE: env.NODE_ENV === "production", 
  SAME_SITE: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax" | "strict", 
  DOMAIN: env.NODE_ENV === "production" ? "gravityconstruction.co.in" : "localhost",
  MAX_AGE_ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  MAX_AGE_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
};

