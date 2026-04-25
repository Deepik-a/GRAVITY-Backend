import { UserSignUp, GoogleSignUp } from "@/domain/entities/User";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { IOtpService } from "@/domain/services/IOTPService"; 
import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import bcrypt from "bcryptjs";
import redisClient from "@/infrastructure/config/redis";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IRegisterUseCase } from "@/application/interfaces/use-cases/user/IRegisterUseCase";
import { SignupRequestDto } from "@/application/dtos/user/SignupRequestDto";
import { SignupResponseDto } from "@/application/dtos/user/SignupResponseDto";
import { Messages } from "@/shared/constants/message";

@injectable()
export class RegisterUseCase implements IRegisterUseCase {
  constructor(
   @inject(TYPES.UserRepository) private readonly _userRepo: IAuthRepository,
   @inject(TYPES.CompanyRepository) private readonly _companyRepo: IAuthRepository,
   @inject(TYPES.OtpService) private _otpService: IOtpService
  ) {}

  async execute(payload: SignupRequestDto): Promise<SignupResponseDto> {
    const { role } = payload;
    const repo = role === "company" ? this._companyRepo : this._userRepo;

    // 1) Check if email exists in current role
    const existing = await repo.findByEmail(payload.email);
    
    if (existing) {
      // Check if user signed up with Google
      if (existing.provider === "google") {
        throw new Error(Messages.AUTH.EMAIL_REGISTERED_WITH_GOOGLE);
      }
      throw new Error(Messages.AUTH.EMAIL_ALREADY_IN_USE);
    }

    // 2) Check if email exists in OTHER role
    if (role === "user") {
      const existingCompany = await this._companyRepo.findByEmail(payload.email);
      if (existingCompany) {
        if (existingCompany.provider === "google") {
          throw new Error(Messages.AUTH.EMAIL_REGISTERED_WITH_GOOGLE);
        }
        throw new Error(Messages.AUTH.EMAIL_REGISTERED_AS_COMPANY);
      }
    } else {
      const existingUser = await this._userRepo.findByEmail(payload.email);
      if (existingUser) {
        if (existingUser.provider === "google") {
          throw new Error(Messages.AUTH.EMAIL_REGISTERED_WITH_GOOGLE);
        }
        throw new Error(Messages.AUTH.EMAIL_REGISTERED_AS_USER);
      }
    }

    // ---------------- Google Signup ----------------
    if (payload.googleId) {
      const googleUser = new GoogleSignUp(
        payload.name,
        payload.email,
        payload.googleId,
        role,
        "google",
        role === "company" ? "pending" : "verified"
      );

      await repo.createWithGoogle(googleUser);
      return { message: `${role} created using Google` };
    }

    // ---------------- Local Signup ----------------
    if (!payload.password) throw new Error(Messages.AUTH.PASSWORD_REQUIRED);

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const tempUser = new UserSignUp(
      new UniqueEntityID("temp"),
      payload.name,
      payload.email,
      hashedPassword,
      role,
      "local",
      payload.phone ?? "",
      role === "company" ? "pending" : "verified"
    );

    await redisClient.setEx(`tempUser:${payload.email}`, 600, JSON.stringify(tempUser));

    await this._otpService.generateOtp(payload.email, OtpPurpose.SIGNUP);

    return { message: `OTP sent to ${payload.email}. Please verify to complete signup.` };
  }
}