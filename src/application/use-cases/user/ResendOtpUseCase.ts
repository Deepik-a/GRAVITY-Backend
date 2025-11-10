import redisClient from "../../../infrastructure/config/redis.js";
import { OtpService } from "../../providers/OTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";

export class ResendOtpUseCase {
  private otpService: OtpService;

  constructor() {
    this.otpService = new OtpService();
  }

  async execute(email: string): Promise<{ message: string }> {
    console.log("STEP 1: Inside ResendOtpUseCase, email:", email);

    // Step 2: Check if there is a temp user entry in Redis
    const tempUserKey = `tempUser:${email}`;
    const existingUser = await redisClient.get(tempUserKey);

    if (!existingUser) {
      throw new Error("No pending signup found for this email. Please register again.");
    }

    // Step 3: Generate and send new OTP
    console.log("STEP 3: Generating new OTP for:", email);
    await this.otpService.generateOtp(email, OtpPurpose.SIGNUP);

    console.log("STEP 4: OTP resent successfully");
    return { message: "OTP resent successfully. Please check your email." };
  }
}
