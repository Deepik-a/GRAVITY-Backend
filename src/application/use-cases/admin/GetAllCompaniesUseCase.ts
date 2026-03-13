import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";
import { IGetAllCompaniesUseCase } from "@/application/interfaces/use-cases/admin/IGetAllCompaniesUseCase";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { CompanyMapper } from "@/application/mappers/CompanyMapper";

@injectable()
export class GetAllCompaniesUseCase implements IGetAllCompaniesUseCase {
  constructor(@inject(TYPES.CompanyRepository) private _companyRepo: ICompanyRepository) {}

  async execute(): Promise<CompanyResponseDto[]> {
    // dto can be used for filters/pagination in the future
    const companies = await this._companyRepo.getAllCompanies();
    return companies.map(CompanyMapper.toResponseDTO);
  }
}
