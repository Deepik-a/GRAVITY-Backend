// src/application/use-cases/admin/GetAllUsersUseCase.ts
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UserProfile } from "../../../domain/entities/User";
import { IGetAllUsersUseCase } from "../../interfaces/use-cases/admin/IGetAllUsersUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";

@injectable()
export class GetAllUsersUseCase implements IGetAllUsersUseCase {
  constructor(@inject(TYPES.UserRepository) private readonly _userRepo: IUserRepository) {}

  async execute(): Promise<UserProfile[]> {
    return this._userRepo.getAllUsers();
  }
}
