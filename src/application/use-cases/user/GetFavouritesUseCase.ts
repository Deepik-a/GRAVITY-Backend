
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IGetFavouritesUseCase } from "@/application/interfaces/use-cases/user/IGetFavouritesUseCase";

import { ICompany } from "@/domain/entities/Company";

@injectable()
export class GetFavouritesUseCase implements IGetFavouritesUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<ICompany[]> {
    if (!userId) {
      throw new AppError("User ID is required", StatusCode.BAD_REQUEST);
    }
    return await this._userRepository.getFavourites(userId);
  }
}
