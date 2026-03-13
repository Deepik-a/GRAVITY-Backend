export const cookieData = {
  httpONLY:true,
  SECURE: false, // Changed from true to false for local development (HTTP)
  SAME_SITE: "lax" as const, // Changed from strict to lax for easier local dev
  MAX_AGE_ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  MAX_AGE_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
};

