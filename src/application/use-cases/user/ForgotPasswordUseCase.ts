import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { OtpService } from "../../providers/OTPService.js";

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private otpService: OtpService
  ) {}

  async execute(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error("No account found with this email.");
    }

    await this.otpService.generateOtp(email, OtpPurpose.FORGOT_PASSWORD);

    return {
      success: true,
      message: "OTP has been sent to your registered email address.",
    };
  }
}
