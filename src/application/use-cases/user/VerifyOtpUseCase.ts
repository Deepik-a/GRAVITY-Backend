import { UserSignUp, GoogleSignUp } from "@/domain/entities/User";
import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { GoogleUserMapper } from "@/application/mappers/GoogleUserMapper";
import redisClient from "@/infrastructure/config/redis";
import { IOtpService } from "@/domain/services/IOTPService";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { env } from "@/infrastructure/config/env";
import { IVerifyOtpUseCase } from "@/application/interfaces/use-cases/user/IVerifyOtpUseCase";
import { VerifyOtpRequestDto, GoogleUserResponseDto } from "@/application/dtos/AuthDTOs";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class VerifyOtpUseCase implements IVerifyOtpUseCase {
  constructor(
      @inject(TYPES.UserRepository)  private _userRepository: IAuthRepository,
      @inject(TYPES.CompanyRepository)  private _companyRepository: IAuthRepository,
      @inject(TYPES.OtpService)  private _otpService: IOtpService // DEPEND ON INTERFACE
  ) {}
async execute(dto: VerifyOtpRequestDto) {
  const { email, otp, purpose } = dto;
  try {
    // Step 1️⃣: Verify OTP
    await this._otpService.verifyOtp(email, otp, purpose);

    if (purpose === OtpPurpose.SIGNUP) {
      // Load temp user from Redis
      const tempData = await redisClient.get(`tempUser:${email}`);
      if (!tempData) throw new AppError("User data expired or not found in Redis", StatusCode.BAD_REQUEST);

      const parsed = JSON.parse(tempData);
      const role = parsed.role; 
      const repo = role === "company" ? this._companyRepository : this._userRepository;
   

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
      const userId = createdUser.id.toString();
      const accessToken = jwt.sign(
        { userId, role: role || "user" },
        env.JWT_ACCESS_SECRET,
        { expiresIn: env.JWT_ACCESS_EXPIRATION}
      );
      const refreshToken = jwt.sign(
        { userId, role: role || "user" },
        env.JWT_REFRESH_SECRET,
        { expiresIn: env.JWT_REFRESH_EXPIRATION }
      );

      let userResponse: UserSignUp | GoogleUserResponseDto = createdUser;
      if (createdUser.provider === "google") {
        userResponse = GoogleUserMapper.toResponseDTO(createdUser as unknown as GoogleSignUp, accessToken);
      }

      return {
        success: true,
        message: `${role || "User"} registered successfully`,
        user: userResponse,
        accessToken,
        refreshToken,
        role: role || "user"
      };
    }

    // 🟦 FORGOT PASSWORD FLOW
    if (purpose === OtpPurpose.FORGOT_PASSWORD) {
      // Fetch user or company from database
      const user = await this._userRepository.findByEmail(email);
      const company = await this._companyRepository.findByEmail(email);

      if (!user && !company) throw new AppError("No account found for this email", StatusCode.NOT_FOUND);

      const role = user ? "user" : "company";
    
      return {
        success: true,
        role,
        message: Messages.AUTH.OTP_SUCCESS,
      };
    }

    throw new AppError("Invalid OTP purpose", StatusCode.BAD_REQUEST);
  } catch (err: unknown) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : "Unknown error";
    // Propagate as AppError if possible, or 400
    throw new AppError(message, StatusCode.BAD_REQUEST);
  }
}

}
