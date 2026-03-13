import { AdminLoginRequestDto } from "@/application/dtos/admin/AdminLoginRequestDto";
import { AdminLoginResponseDto } from "@/application/dtos/admin/AdminLoginResponseDto";

export interface IAdminLoginUseCase {
  execute(dto: AdminLoginRequestDto): Promise<AdminLoginResponseDto>;
}
