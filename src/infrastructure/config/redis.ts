import { createClient } from "redis";
import { env } from "@/infrastructure/config/env";
import { logger } from "@/domain/services/Logger";

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 10000, // 10 seconds timeout for initial connection
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        // Stop retrying after many attempts to avoid log flood
        return new Error("Redis connection failed permanently after 20 retries");
      }
      // Linear backoff with a cap of 5 seconds
      return Math.min(retries * 500, 5000);
    }
  }
});


redisClient.on("error",(err)=>logger.error("Redis Client error", { error: err }));


export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      logger.info("Connecting to Redis...");
      await redisClient.connect();
      logger.info(" Connected to Redis");
    } else {
      logger.info("Redis already connected");
    }
  } catch (err) {
    logger.error(" Redis Connection Failed. Make sure Redis is running.", { error: err });
    // Note: We're not re-throwing here so the server can attempt to start/log properly, 
    // although features requiring Redis will fail until it's up.
  }
};

export default redisClient;


