// src/application/use-cases/admin/IGetAllUsersUseCase.ts
import { UserListResponseDto } from "@/application/dtos/admin/UserListResponseDto";
// import { GetAllUsersRequestDto } from "@/application/dtos/admin/GetAllUsersRequestDto";

export interface IGetAllUsersUseCase {
  execute(): Promise<UserListResponseDto[]>;
}
