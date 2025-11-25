// application/use-cases/admin/GetAllCompaniesUseCase.ts
import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import { ICompany } from "../../../domain/entities/Company.js";
import { IGetAllCompaniesUseCase } from "../../interfaces/use-cases/admin/IGetAllCompaniesUseCase.js";

export class GetAllCompaniesUseCase  implements IGetAllCompaniesUseCase {
  constructor(private companyRepo: ICompanyRepository) {}

  async execute(): Promise<ICompany[]> {
    return this.companyRepo.getAllCompanies();
  }
}
