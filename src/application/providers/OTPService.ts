import redisClient from "../../infrastructure/config/redis.js";
import { EmailService } from "./EmailService.js";
import { OtpPurpose } from "../../domain/enums/OtpPurpose.js";

export class OtpService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  async generateOtp(email: string, purpose: OtpPurpose) {
    try {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      console.log("Saving OTP in Redis...");
      await redisClient.setEx(`otp:${purpose}:${email}`, 120, otp);
      console.log("OTP saved successfully.");

      console.log("Sending OTP email...");
      await this.emailService.sendOtpEmail(email, otp);
      console.log("OTP email sent successfully.");

      return { success: true, message: "OTP generated and sent successfully" };
    } catch (error: any) {
      console.error("Error in generateOtp:", error.message || error);
      // Throw a new error to be handled by the controller
      throw new Error("Failed to generate or send OTP. Please try again later.");
    }
  }

  async verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
    try {
      console.log("Verifying OTP...");
      const storedOtp = await redisClient.get(`otp:${purpose}:${email}`);

      if (!storedOtp) {
        console.warn("OTP expired or not found for:", email);
        throw new Error("OTP expired or not found");
      }

      if (storedOtp !== otp) {
        console.warn("Invalid OTP entered for:", email);
        throw new Error("Invalid OTP");
      }

      await redisClient.del(`otp:${purpose}:${email}`);
      console.log("OTP verified and deleted successfully.");

      return { success: true, message: "OTP verified successfully" };
    } catch (error: any) {
      console.error("Error in verifyOtp:", error.message || error);
      throw new Error(error.message || "Failed to verify OTP. Please try again.");
    }
  }
}
