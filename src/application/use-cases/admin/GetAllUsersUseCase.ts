import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { UserListResponseDto } from "@/application/dtos/admin/UserListResponseDto";
import { IGetAllUsersUseCase } from "@/application/interfaces/use-cases/admin/IGetAllUsersUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { UserMapper } from "@/application/mappers/UserMapper";

@injectable()
export class GetAllUsersUseCase implements IGetAllUsersUseCase {
  constructor(@inject(TYPES.UserRepository) private readonly _userRepo: IUserRepository) {}

  async execute(): Promise<UserListResponseDto[]> {
    // dto can be used for filters/pagination in the future
    const users = await this._userRepo.getAllUsers();
    return users.map(UserMapper.toUserListResponseDto);
  }
}
