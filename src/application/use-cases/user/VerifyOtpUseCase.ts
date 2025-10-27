import { UserSignUp } from "../../../domain/entities/User.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { OtpService } from "../../providers/OTPService.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export class VerifyOtpUseCase {
constructor(private userRepository:IUserRepository){}

async execute(email:string,otp:string){

const otpService= new OtpService();

 otpService.verifyOtp(email,otp,OtpPurpose.SIGNUP)

 
  // Step 2: Retrieve temporary user data
    const tempData = await redisClient.get(`tempUser:${email}`);
    if (!tempData) throw new Error("User data expired or not found");

    const parsed = JSON.parse(tempData);
    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    const user = new UserSignUp(parsed.name, parsed.email, parsed.phone || "", hashedPassword);
    const createdUser = await this.userRepository.create(user);

    // Step 3: Generate JWT Token
    const token = jwt.sign(
      { id: createdUser.email, role: "user" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    await redisClient.del(`tempUser:${email}`); // cleanup

    return { message: "User registered successfully", user: createdUser, token };
  }
}

