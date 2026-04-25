
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import bcrypt from "bcryptjs";
import { ChangePasswordDto } from "@/application/dtos/AuthDTOs";

import { IChangePasswordUseCase } from "@/application/interfaces/use-cases/user/IChangePasswordUseCase";
import { Messages } from "@/shared/constants/message";

@injectable()
export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(userId: string, { oldPassword, newPassword }: ChangePasswordDto): Promise<void> {
    if (!userId || !oldPassword || !newPassword) {
      throw new AppError(Messages.VALIDATION.REQUIRED_FIELDS_MISSING, StatusCode.BAD_REQUEST);
    }

    const isValid = await this._userRepository.verifyPassword(userId, oldPassword);
    if (!isValid) {
      throw new AppError(Messages.AUTH.INVALID_CREDENTIALS, StatusCode.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.changePassword(userId, hashedPassword);
  }
}
