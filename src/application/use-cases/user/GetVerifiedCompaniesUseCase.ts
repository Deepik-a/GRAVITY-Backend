import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ICompany } from "@/domain/entities/Company";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetVerifiedCompaniesUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(): Promise<ICompany[]> {
    const allCompanies = await this._companyRepository.getAllCompanies();
    
    // Filter only verified companies with filled profiles
    return allCompanies.filter(
      (company) => 
        company.documentStatus === "verified" && 
        company.isProfileFilled === true &&
        company.isBlocked !== true
    );
  }
}
