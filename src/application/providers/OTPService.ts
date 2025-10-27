import redisClient from "../../infrastructure/config/redis.js";
import { EmailService } from "./EmailService.js";
import { OtpPurpose } from "../../domain/enums/OtpPurpose.js";


export class OtpService{


    private emailService:EmailService;

    constructor(){
        this.emailService=new EmailService();
    }

    async generateOtp(email:string,purpose:OtpPurpose){

    const otp = Math.floor(10000 + Math.random() * 90000).toString();

     // Save OTP temporarily in Redis (expires in 5 minutes)
    await redisClient.setEx(`otp:${purpose}:${email}`, 300, otp);

    await this.emailService.sendOtpEmail(email,otp)

}

async verifyOtp(email:string,otp:string,purpose:OtpPurpose){


    const storedOtp=await redisClient.get(`otp:${purpose}:${email}`)

    if(!storedOtp) throw new Error("OTP expired or not found");
   if (storedOtp !== otp) throw new Error("Invalid OTP");

    await redisClient.del(`otp:${purpose}:${email}`);
    return true;

}
}