import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IAdminRepository } from "@/domain/repositories/IAdminRepository";

@injectable()
export class GetAdminDashboardStatsUseCase {
  constructor(
    @inject(TYPES.AdminRepository) private _adminRepository: IAdminRepository
  ) {}

  async execute() {
    return await this._adminRepository.getDashboardStats();
  }
}
