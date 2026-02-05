
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IToggleFavouriteUseCase } from "@/application/interfaces/use-cases/user/IToggleFavouriteUseCase";

@injectable()
export class ToggleFavouriteUseCase implements IToggleFavouriteUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(userId: string, companyId: string): Promise<string[]> {
    if (!userId || !companyId) {
      throw new AppError("Invalid data", StatusCode.BAD_REQUEST);
    }
    return await this._userRepository.toggleFavourite(userId, companyId);
  }
}
