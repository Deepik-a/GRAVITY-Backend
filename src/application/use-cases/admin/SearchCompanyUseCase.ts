import { ISearchCompaniesUseCase } from "@/application/interfaces/use-cases/admin/ISearchCompaniesUseCase";
import { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";

@injectable()
export class SearchCompanyUseCase implements ISearchCompaniesUseCase {
  constructor(
    @inject(TYPES.AdminRepository) private _adminRepository: IAdminRepository
  ) {}

  async execute(query: string, page: number, limit: number, status?: string) {
    const result = await this._adminRepository.searchCompanies(query, page, limit, status);
    
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    };
  }
}
