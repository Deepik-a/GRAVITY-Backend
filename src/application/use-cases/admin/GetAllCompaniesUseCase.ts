// application/use-cases/admin/GetAllCompaniesUseCase.ts
import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository.js";
import { ICompany } from "../../../domain/entities/Company.js";
import { IGetAllCompaniesUseCase } from "../../interfaces/use-cases/admin/IGetAllCompaniesUseCase.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types.js";

@injectable()
export class GetAllCompaniesUseCase  implements IGetAllCompaniesUseCase {
  constructor( @inject(TYPES.CompanyRepository)private companyRepo: ICompanyRepository) {}

  async execute(): Promise<ICompany[]> {
    return this.companyRepo.getAllCompanies();
  }
}
