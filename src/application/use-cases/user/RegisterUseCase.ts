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
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class RegisterUseCase implements IRegisterUseCase {
  constructor(
   @inject(TYPES.UserRepository) private readonly _userRepo: IAuthRepository,
   @inject(TYPES.CompanyRepository) private readonly _companyRepo: IAuthRepository,
   @inject(TYPES.OtpService) private _otpService: IOtpService
  ) {}

  async execute(payload: {
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    phone: string;
    role: "user" | "company";
  }): Promise<{ message: string }> {
    const { role } = payload;
    const repo = role === "company" ? this._companyRepo : this._userRepo;

 
    
    // 1) Check if email exists in current role
    const existing = await repo.findByEmail(payload.email);
    if (existing) throw new AppError("Email already in use",StatusCode.BAD_REQUEST);

    // 2) Check if email exists in OTHER role
    if (role === "user") {
      const existingCompany = await this._companyRepo.findByEmail(payload.email);
      if (existingCompany) throw new AppError("Email is already registered as company",StatusCode.BAD_REQUEST);
    } else {
      const existingUser = await this._userRepo.findByEmail(payload.email);
      if (existingUser) throw new AppError("Email is already registered as user",StatusCode.BAD_REQUEST);
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
    if (!payload.password) throw new AppError("Password required",StatusCode.BAD_REQUEST);

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

