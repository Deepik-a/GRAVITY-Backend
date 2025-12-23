import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";
import { IGetAllCompaniesUseCase } from "@/application/interfaces/use-cases/admin/IGetAllCompaniesUseCase";
// import { GetAllCompaniesRequestDto } from "@/application/dtos/admin/GetAllCompaniesRequestDto";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetAllCompaniesUseCase implements IGetAllCompaniesUseCase {
  constructor(@inject(TYPES.CompanyRepository) private _companyRepo: ICompanyRepository) {}

  async execute(): Promise<CompanyResponseDto[]> {
    // dto can be used for filters/pagination in the future
    const companies = await this._companyRepo.getAllCompanies();
    return companies.map(company => ({
      id: company.id.toString(),
      name: company.name,
      email: company.email,
      phone: company.phone ?? null,
      location: company.location ?? null,
      documentStatus: company.documentStatus,
      rejectionReason: company.rejectionReason ?? null,
      documents: company.documents
    }));
  }
}
