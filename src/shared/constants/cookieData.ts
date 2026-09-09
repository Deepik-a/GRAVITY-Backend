const isProduction = process.env.NODE_ENV === "production";

export const cookieData = {
  httpONLY: true,
  SECURE: isProduction, // Must be true in production for HTTPS cross-site cookies
  SAME_SITE: isProduction ? ("none" as const) : ("lax" as const), // "none" in production for cross-origin, "lax" for local dev
  MAX_AGE_ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  MAX_AGE_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
};


