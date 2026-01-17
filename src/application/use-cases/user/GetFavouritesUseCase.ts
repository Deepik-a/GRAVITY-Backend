
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class GetFavouritesUseCase {
  constructor(
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<any[]> {
    if (!userId) {
      throw new AppError("User ID is required", StatusCode.BAD_REQUEST);
    }
    return await this._userRepository.getFavourites(userId);
  }
}
