import bcrypt from "bcryptjs";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";

export class ResetPasswordUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(email: string, newPassword: string) {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await this.userRepository.updatePassword(email, hashedPassword);

    return {
      success: true,
      message: "Password has been reset successfully.",
    };
  }
}
