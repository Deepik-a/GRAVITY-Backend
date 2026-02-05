import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ICompany } from "@/domain/entities/Company";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetVerifiedCompaniesUseCase } from "@/application/interfaces/use-cases/user/IGetVerifiedCompaniesUseCase";

@injectable()
export class GetVerifiedCompaniesUseCase implements IGetVerifiedCompaniesUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(params: {
    query?: string;
    page: number;
    limit: number;
    category?: string[];
    services?: string[];
    companySize?: string;
    minPrice?: number;
    maxPrice?: number;
    minExperience?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: ICompany[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this._companyRepository.getCompanies(params);
  }
}
