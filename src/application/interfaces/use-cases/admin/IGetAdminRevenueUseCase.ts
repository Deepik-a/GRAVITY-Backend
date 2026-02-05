import { AdminRevenueResponseDto } from "@/application/dtos/admin/AdminRevenueResponseDto";

export interface IGetAdminRevenueUseCase {
  execute(): Promise<AdminRevenueResponseDto>;
}
