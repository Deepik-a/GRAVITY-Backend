import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { IOtpService } from "@/domain/services/IOTPService";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IForgotPasswordUseCase } from "@/application/interfaces/use-cases/user/IForgotPasswordUseCase";
import { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "@/application/dtos/AuthDTOs";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
  constructor(
  @inject(TYPES.AuthRepository )private _userRepository: IAuthRepository,
 @inject(TYPES.AuthRepository) private _companyRepository: IAuthRepository,
 @inject(TYPES.OtpService) private _otpService: IOtpService ,

  ) {}

  async execute(dto: ForgotPasswordRequestDto): Promise<ForgotPasswordResponseDto> {
    const { email } = dto;

    // First check local user
    const localUser = await this._userRepository.findByEmail(email);

    if (localUser) {
      // Local account → send OTP normally
      await this._otpService.generateOtp(email, OtpPurpose.FORGOT_PASSWORD,"user");
      return {
        success: true,
        message: Messages.AUTH.OTP_SUCCESS,
      };
    }

    // 🔍 2. Check Company account

const company = await this._companyRepository.findByEmail(email);
 if (company) { await this._otpService.generateOtp(email, OtpPurpose.FORGOT_PASSWORD, "company");
 return { success: true, message:Messages.AUTH.OTP_SUCCESS, }; }


    // If not local user → check google login
    const googleUser = await this._userRepository.findGoogleUserByEmail(email);

    if (googleUser) {
      // Google account → password reset not needed
      return {
        success: false,
        message:Messages.AUTH.GOOGLE_USER
      };
    }

    // No account found at all
    throw new AppError("No account found with this email.", StatusCode.NOT_FOUND);
  }
}

