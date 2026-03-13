
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import bcrypt from "bcryptjs";
import { ChangePasswordDto } from "@/application/dtos/AuthDTOs";

import { IChangePasswordUseCase } from "@/application/interfaces/use-cases/user/IChangePasswordUseCase";

@injectable()
export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(userId: string, { oldPassword, newPassword }: ChangePasswordDto): Promise<void> {
    if (!userId || !oldPassword || !newPassword) {
      throw new AppError("All fields are required", StatusCode.BAD_REQUEST);
    }

    const isValid = await this._userRepository.verifyPassword(userId, oldPassword);
    if (!isValid) {
      throw new AppError("Incorrect current password", StatusCode.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.changePassword(userId, hashedPassword);
  }
}
