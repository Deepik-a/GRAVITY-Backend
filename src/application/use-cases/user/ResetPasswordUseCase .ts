import bcrypt from "bcryptjs";
import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import redisClient from "../../../infrastructure/config/redis.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { Messages } from "../../../shared/constants/message.js";

export class ResetPasswordUseCase {
  constructor(private _userRepository: IAuthRepository,
private _companyRepository: IAuthRepository) {}

  async execute(email: string, newPassword: string) {

      const key = `otp:${OtpPurpose.FORGOT_PASSWORD}:${email}`;
    // Read role saved in OTP stage
 const data = await redisClient.get(`otp:${OtpPurpose.FORGOT_PASSWORD}:${email}`);   
if (!data) throw new Error("Password reset session expired");

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
