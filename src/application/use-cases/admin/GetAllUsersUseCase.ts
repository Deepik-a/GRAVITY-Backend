import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { UserListResponseDto } from "@/application/dtos/admin/UserListResponseDto";
import { IGetAllUsersUseCase } from "@/application/interfaces/use-cases/admin/IGetAllUsersUseCase";
// import { GetAllUsersRequestDto } from "@/application/dtos/admin/GetAllUsersRequestDto";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetAllUsersUseCase implements IGetAllUsersUseCase {
  constructor(@inject(TYPES.UserRepository) private readonly _userRepo: IUserRepository) {}

  async execute(): Promise<UserListResponseDto[]> {
    // dto can be used for filters/pagination in the future
    const users = await this._userRepo.getAllUsers();
    return users.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role || "user"
    }));
  }
}
