// src/application/use-cases/admin/GetAllUsersUseCase.ts
import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UserProfile } from "../../../domain/entities/User";
import { IGetAllUsersUseCase } from "../../interfaces/use-cases/admin/IGetAllUsersUseCase";

export class GetAllUsersUseCase implements IGetAllUsersUseCase {
  constructor(private readonly _userRepo: IUserRepository) {}

  async execute(): Promise<UserProfile[]> {
    return this._userRepo.getAllUsers();
  }
}
