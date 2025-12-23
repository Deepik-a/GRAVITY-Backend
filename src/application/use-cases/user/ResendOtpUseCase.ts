import redisClient from "@/infrastructure/config/redis";
import { IOtpService } from "@/domain/services/IOTPService";
import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IResendOtpUseCase } from "@/application/interfaces/use-cases/user/IResendOtpUseCase";
import { ResendOtpRequestDto, ResendOtpResponseDto } from "@/application/dtos/AuthDTOs";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class ResendOtpUseCase implements IResendOtpUseCase {
  constructor(
    @inject(TYPES.OtpService) private _otpService: IOtpService,
     @inject(TYPES.AuthRepository) private _userRepository: IAuthRepository,
     @inject(TYPES.AuthRepository) private _companyRepository: IAuthRepository
  ) {}

  async execute(dto: ResendOtpRequestDto): Promise<ResendOtpResponseDto> {
    const { email } = dto;
    let purpose: OtpPurpose;

    // Check for pending signup first
    const tempUserKey = `tempUser:${email}`;
    const existingUser = await redisClient.get(tempUserKey);

    if (existingUser) {
      purpose = OtpPurpose.SIGNUP;
    } else {
      // Check if this email exists in user or company DB
      const userExists = await this._userRepository.findByEmail(email);
      const companyExists = await this._companyRepository.findByEmail(email);

      if (userExists || companyExists) {
        purpose = OtpPurpose.FORGOT_PASSWORD;
      } else {
        throw new AppError(
          "No pending signup or registered account found for this email.",
          StatusCode.NOT_FOUND
        );
      }
    }

    // Generate OTP with correct purpose
    await this._otpService.generateOtp(email, purpose);

    return { message: Messages.AUTH.OTP_RESEND_SUCCESS };
  }
}
