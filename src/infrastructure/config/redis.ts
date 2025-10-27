import  {createClient} from 'redis'

const redisClient=createClient({
    url:process.env.REDIS_URL||"redis://localhost:6379",
})


redisClient.on("error",(err)=>console.error("Redis Client error",err))


export const connectRedis = async () => {
if(!redisClient.isOpen){
    await redisClient.connect()
      console.log("✅ Connected to Redis");
}else{
  console.log("Redis already connected");
    }
}

export default redisClient;


