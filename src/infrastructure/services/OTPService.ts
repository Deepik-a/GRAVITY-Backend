import redisClient from "../config/redis.js";
import { EmailService } from "./EmailService.js";
import { OtpPurpose } from "../../domain/enums/OtpPurpose.js";
import { IOtpService } from "../../domain/services/IOTPService.js";
import { Messages } from "../../shared/constants/message.js";
import { injectable,inject } from "inversify";
import { TYPES } from "../DI/types.js";
import { ILogger } from "@/domain/services/ILogger";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class OtpService implements IOtpService {
  constructor(
    @inject(TYPES.EmailService) private _emailService: EmailService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ){}

  async generateOtp(email: string, purpose: OtpPurpose,role?: "user" | "company") {
    try {
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      this._logger.info("Saving OTP in Redis...");
      await redisClient.setEx(`otp:${purpose}:${email}`, 120, JSON.stringify({ otp, role }));
      this._logger.info("OTP saved successfully.");

      this._logger.info("Sending OTP email...");
      await this._emailService.sendOtpEmail(email, otp);
      this._logger.info("OTP email sent successfully.");

      return { success: true, message:Messages.AUTH.OTP_GENERATE_SUCCESS  };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      this._logger.error("Error in generateOtp:", { error: errorMessage });
      // Throw a new error to be handled by the controller
      throw new AppError("Failed to generate or send OTP. Please try again later.", StatusCode.INTERNAL_ERROR);
    }
  }

  async verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
    try {
      this._logger.info("Verifying OTP...", { purpose });
      const storedOtp = await redisClient.get(`otp:${purpose}:${email}`);
const key = `otp:${purpose}:${email}`;
      if (!storedOtp) {
        this._logger.warn("OTP expired or not found for:", { email });
        throw new AppError("OTP expired or not found", StatusCode.BAD_REQUEST);
      }
const parsed = JSON.parse(storedOtp);
this._logger.info("Parsed OTP data from Redis", { parsed, otpEntered: otp });
      if (parsed.otp !== otp) {
        this._logger.warn("Invalid OTP entered for:", { email });
        throw new AppError("Invalid OTP", StatusCode.BAD_REQUEST);
      }
      
    // ❗️ Remove only OTP, keep role
    delete (parsed as Record<string, unknown>).otp;

     // Save modified data back to Redis with same expiry
    await redisClient.setEx(key, 300, JSON.stringify(parsed));
      this._logger.info("OTP verified and deleted successfully.");

;if (purpose === OtpPurpose.FORGOT_PASSWORD) {
return parsed.role;
}

      return { success: true, message:Messages.AUTH.OTP_VERIFY_SUCCESS };
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      this._logger.error("Error in verifyOtp:", { error: errorMessage });
      throw new AppError(errorMessage || "Failed to verify OTP. Please try again.", StatusCode.INTERNAL_ERROR);
    }
  }
}
