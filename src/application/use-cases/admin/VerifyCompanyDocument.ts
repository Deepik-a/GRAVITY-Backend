import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { EmailService } from "@/infrastructure/services/EmailService";
import { IVerifyCompanyUseCase } from "@/application/interfaces/use-cases/admin/IVerifyCompanyUseCase";
import { VerifyCompanyRequestDto } from "@/application/dtos/admin/VerifyCompanyRequestDto";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";

@injectable()
export class VerifyCompanyUseCase implements IVerifyCompanyUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private _companyRepo: ICompanyRepository,
    @inject(TYPES.EmailService) private _emailService: EmailService
  ) {}


  async execute(dto: VerifyCompanyRequestDto): Promise<CompanyResponseDto> {
    const { companyId, approve, reason } = dto; 
    
    const status = approve ? "verified" : "rejected";

    const updatedCompany = await this._companyRepo.updateDocumentStatus(
        { companyId }, 
        status, 
        reason
    );

    if (!approve && reason) {
      await this._emailService.sendRejectionEmail(updatedCompany.email, reason);
    }

    return updatedCompany; 
  }
}