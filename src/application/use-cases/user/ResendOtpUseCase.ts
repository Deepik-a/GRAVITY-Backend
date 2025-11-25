import redisClient from "../../../infrastructure/config/redis.js";
import { IOtpService } from "../../../domain/services/IOTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { Messages } from "../../../shared/constants/message.js";

export class ResendOtpUseCase {
  constructor(
    private _otpService: IOtpService,
    private _userRepository: IAuthRepository,
    private _companyRepository: IAuthRepository
  ) {}

  async execute(email: string): Promise<{ message: string }> {
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
        throw new Error(
          "No pending signup or registered account found for this email."
        );
      }
    }

    // Generate OTP with correct purpose
    await this._otpService.generateOtp(email, purpose);

    return { message: Messages.AUTH.OTP_RESEND_SUCCESS };
  }
}
