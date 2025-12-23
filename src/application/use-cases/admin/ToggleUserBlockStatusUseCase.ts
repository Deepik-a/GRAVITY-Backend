import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IToggleUserBlockStatusUseCase } from "@/application/interfaces/use-cases/admin/IToggleUserBlockStatusUseCase";
import { ToggleBlockStatusRequestDto } from "@/application/dtos/admin/ToggleBlockStatusRequestDto";
import { UserProfile } from "@/domain/entities/User";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class ToggleUserBlockStatusUseCase implements IToggleUserBlockStatusUseCase {
  constructor(
    @inject(TYPES.UserRepository) private readonly _userRepository: IUserRepository
  ) {}

  async execute(data: ToggleBlockStatusRequestDto): Promise<UserProfile> {
    const { id, isBlocked } = data;
    
    const updatedUser = await this._userRepository.updateBlockStatus(id, isBlocked);

    if (!updatedUser) {
      throw new AppError("User not found", StatusCode.NOT_FOUND);
    }

    return updatedUser;
  }
}
