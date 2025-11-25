// src/application/use-cases/admin/IGetAllUsersUseCase.ts
import { UserProfile } from "../../../../domain/entities/User";

export interface IGetAllUsersUseCase {
  execute(): Promise<UserProfile[]>;
}
