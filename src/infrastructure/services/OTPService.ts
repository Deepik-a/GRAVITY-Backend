import redisClient from "../config/redis.js";
import { EmailService } from "./EmailService.js";
import { OtpPurpose } from "../../domain/enums/OtpPurpose.js";
import { IOtpService } from "../../domain/services/IOTPService.js";
import { Messages } from "../../shared/constants/message.js";

export class OtpService implements IOtpService {
  private _emailService: EmailService;

  constructor() {
    this._emailService = new EmailService();
  }

  async generateOtp(email: string, purpose: OtpPurpose,role?: "user" | "company") {
    try {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      console.log("Saving OTP in Redis...");
      await redisClient.setEx(`otp:${purpose}:${email}`, 120, JSON.stringify({ otp, role }));
      console.log("OTP saved successfully.");

      console.log("Sending OTP email...");
      await this._emailService.sendOtpEmail(email, otp);
      console.log("OTP email sent successfully.");

      return { success: true, message:Messages.AUTH.OTP_GENERATE_SUCCESS  };
    } catch (error: any) {
      console.error("Error in generateOtp:", error.message || error);
      // Throw a new error to be handled by the controller
      throw new Error("Failed to generate or send OTP. Please try again later.");
    }
  }

  async verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
    try {
      console.log("Verifying OTP...");
      console.log(purpose,"otppurpose")
      const storedOtp = await redisClient.get(`otp:${purpose}:${email}`);
const key = `otp:${purpose}:${email}`;
      if (!storedOtp) {
        console.warn("OTP expired or not found for:", email);
        throw new Error("OTP expired or not found");
      }
const parsed = JSON.parse(storedOtp);
console.log(parsed,"parsed")
console.log(otp,"otp")
      if (parsed.otp !== otp) {
        console.warn("Invalid OTP entered for:", email);
        throw new Error("Invalid OTP");
      }
      
    // ❗️ Remove only OTP, keep role
    delete parsed.otp;

     // Save modified data back to Redis with same expiry
    await redisClient.setEx(key, 300, JSON.stringify(parsed));
      console.log("OTP verified and deleted successfully.");

;if (purpose === OtpPurpose.FORGOT_PASSWORD) {
return parsed.role;
}

      return { success: true, message:Messages.AUTH.OTP_VERIFY_SUCCESS };
    } catch (error: any) {
      console.error("Error in verifyOtp:", error.message || error);
      throw new Error(error.message || "Failed to verify OTP. Please try again.");
    }
  }
}
