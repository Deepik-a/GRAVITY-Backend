import bcrypt from "bcryptjs";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import redisClient from "@/infrastructure/config/redis";
import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IResetPasswordUseCase } from "@/application/interfaces/use-cases/user/IResetPasswordUseCase";
import { ResetPasswordRequestDto, ResetPasswordResponseDto } from "@/application/dtos/AuthDTOs";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class ResetPasswordUseCase implements IResetPasswordUseCase {
  constructor( @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository,
@inject(TYPES.AuthRepository) private _companyRepository: IAuthRepository) {}

  async execute(dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    const { email, newPassword } = dto;

      const key = `otp:${OtpPurpose.FORGOT_PASSWORD}:${email}`;
    // Read role saved in OTP stage
    const data = await redisClient.get(`otp:${OtpPurpose.FORGOT_PASSWORD}:${email}`);   
    if (!data) throw new AppError("Password reset session expired", StatusCode.BAD_REQUEST);

    const { role } = JSON.parse(data);

    const repo =
      role === "company" ? this._companyRepository : this._userRepository;
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await repo.updatePassword(email, hashedPassword);

      // ❗ After success, delete the session
    await redisClient.del(key);

    return {
      success: true,
      message:Messages.AUTH.PASSWORD_RESET_SUCCESS ,
    };
  }
}
