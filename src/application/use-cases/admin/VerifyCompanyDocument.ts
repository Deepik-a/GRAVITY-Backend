import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import { ICompany } from "../../../domain/entities/Company.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
import { EmailService } from "../../../infrastructure/services/EmailService";

@injectable()
export class VerifyCompanyUseCase {
  constructor(@inject(TYPES.CompanyRepository) private companyRepo: ICompanyRepository,
    @inject(TYPES.EmailService) private emailService: EmailService
) {}

  async execute(companyId: string, approve: boolean,reason?: string): Promise<ICompany> {
    const status = approve ? "verified" : "rejected";

    // Update documentStatus using companyId
    const updatedCompany = await this.companyRepo.updateDocumentStatus({ companyId }, status,reason);

  // Email only when rejecting
  if (!approve && reason) {
    await this.emailService.sendRejectionEmail(updatedCompany.email, reason);
  }

    return updatedCompany;
  }
}
