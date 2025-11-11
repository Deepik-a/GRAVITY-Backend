import { UserSignUp } from "../../../domain/entities/User.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { OtpService } from "../../providers/OTPService.js";
import jwt from "jsonwebtoken";

export class VerifyOtpUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, otp: string, purpose: OtpPurpose) {
    const otpService = new OtpService();

    try {
      // Step 1️⃣: Verify OTP validity
      await otpService.verifyOtp(email, otp, purpose);

      // 🟩 SIGNUP FLOW
      if (purpose === OtpPurpose.SIGNUP) {
        const tempData = await redisClient.get(`tempUser:${email}`);
        if (!tempData) throw new Error("User data expired or not found");

        const parsed = JSON.parse(tempData);

        // ✅ Log parsed object to ensure correct mapping
        console.log("Parsed temp user from Redis:", parsed);

        // Correctly map fields
        const name = parsed.name;
        const userEmail = parsed.email; // actual email
        const phone = parsed.phone || "";
        const password = parsed.password;
        const role = parsed.role;
        const status = parsed.status;

        // Step 2️⃣: Create user from Redis data
        const user = new UserSignUp(name, userEmail, phone, password, role, status);

        // Step 3️⃣: Save in MongoDB via repository
        const createdUser = await this.userRepository.create(user);

        // ✅ Delete temp data from Redis
        await redisClient.del(`tempUser:${email}`);

        // Step 4️⃣: Generate JWT tokens
        const userId = (createdUser as any).id?.toString?.() || "";

        const accessToken = jwt.sign(
          { userId, role: role || "user" },
          process.env.JWT_ACCESS_SECRET || "access_secret",
          { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
          { userId, role: role || "user" },
          process.env.JWT_REFRESH_SECRET || "refresh_secret",
          { expiresIn: "7d" }
        );

        // Step 5️⃣: Return tokens + user to controller
        return {
          message: `${role || "User"} registered successfully`,
          user: createdUser,
          accessToken,
          refreshToken,
        };
      }

      // 🟦 FORGOT PASSWORD FLOW
      if (purpose === OtpPurpose.FORGOT_PASSWORD) {
        return {
          message: "OTP verified successfully for password reset",
        };
      }

      throw new Error("Invalid OTP purpose");
    } catch (err: unknown) {
      console.error("Error in VerifyOtpUseCase:", err);

      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Unknown error occurred during OTP verification";

      throw new Error(
        message === "Invalid OTP" || message === "OTP expired"
          ? "Invalid or expired OTP"
          : message || "Failed to verify OTP"
      );
    }
  }
}
