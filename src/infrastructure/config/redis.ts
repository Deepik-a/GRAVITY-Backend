import { createClient } from "redis";
import { env } from "./env.js";
import { logger } from "../../domain/services/Logger.js";

const redisClient = createClient({
  url: env.REDIS_URL,
});


redisClient.on("error",(err)=>logger.error("Redis Client error", { error: err }));


export const connectRedis = async () => {
if(!redisClient.isOpen){
    await redisClient.connect();
      logger.info("✅ Connected to Redis");
}else{
  logger.info("Redis already connected");
    }
};

export default redisClient;


