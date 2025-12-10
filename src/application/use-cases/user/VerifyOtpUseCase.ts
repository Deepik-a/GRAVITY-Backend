import { UserSignUp } from "../../../domain/entities/User.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { IOtpService } from "../../../domain/services/IOTPService.js";
import { UniqueEntityID } from "../../../domain/value-objects/UniqueEntityID.js";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { Messages } from "../../../shared/constants/message.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
@injectable()
export class VerifyOtpUseCase {
  constructor(
      @inject(TYPES.UserRepository)  private _userRepository: IAuthRepository,
      @inject(TYPES.CompanyRepository)  private _companyRepository: IAuthRepository,
      @inject(TYPES.OtpService)  private _otpService: IOtpService // DEPEND ON INTERFACE
  ) {}
async execute(email: string, otp: string, purpose: OtpPurpose) {
  try {
    // Step 1️⃣: Verify OTP
    await this._otpService.verifyOtp(email, otp, purpose);

    if (purpose === OtpPurpose.SIGNUP) {
      // Load temp user from Redis
      const tempData = await redisClient.get(`tempUser:${email}`);
      if (!tempData) throw new Error("User data expired or not found in Redis");

      const parsed = JSON.parse(tempData);
      const role = parsed.role; 
      const repo = role === "company" ? this._companyRepository : this._userRepository;
      console.log(repo,"repo")

      const user = new UserSignUp(
        new UniqueEntityID(new ObjectId()),
        parsed.name,
        parsed.email,
        parsed.password,
        parsed.role,
        parsed.provider,
        parsed.phone,
        parsed.status
      );

      const createdUser = await repo.create(user);

      await redisClient.del(`tempUser:${email}`);

      // Generate JWT
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

      return {
        message: `${role || "User"} registered successfully`,
        user: createdUser,
        accessToken,
        refreshToken,
      };
    }

    // 🟦 FORGOT PASSWORD FLOW
    if (purpose === OtpPurpose.FORGOT_PASSWORD) {
      // Fetch user or company from database
      const user = await this._userRepository.findByEmail(email);
      const company = await this._companyRepository.findByEmail(email);

      if (!user && !company) throw new Error("No account found for this email");

      const role = user ? "user" : "company";
console.log(role)
      return {
        success: true,
        role,
        message: Messages.AUTH.OTP_SUCCESS,
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
