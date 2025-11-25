import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import { ICompany } from "../../../domain/entities/Company.js";

export class VerifyCompanyUseCase {
  constructor(private companyRepo: ICompanyRepository) {}

  async execute(companyId: string, approve: boolean): Promise<ICompany> {
    const status = approve ? "verified" : "rejected";

    // Update documentStatus using companyId
    const updatedCompany = await this.companyRepo.updateDocumentStatus({ companyId }, status);

    return updatedCompany;
  }
}
