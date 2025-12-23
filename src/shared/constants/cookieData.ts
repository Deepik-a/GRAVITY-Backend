export const cookieData = {
  httpONLY:true,
  SECURE:true,
  SAME_SITE:"strict" as const,
  MAX_AGE_ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  MAX_AGE_REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
};

