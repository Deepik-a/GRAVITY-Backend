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

    // Update documentStatus using companyId
    const updatedCompany = await this._companyRepo.updateDocumentStatus({ companyId }, status, reason);

    // Email only when rejecting
    if (!approve && reason) {
      await this._emailService.sendRejectionEmail(updatedCompany.email, reason);
    }

    return {
      id: updatedCompany.id.toString(),
      name: updatedCompany.name,
      email: updatedCompany.email,
      phone: updatedCompany.phone ?? null,
      location: updatedCompany.location ?? null,
      documentStatus: updatedCompany.documentStatus,
      rejectionReason: updatedCompany.rejectionReason ?? null,
      documents: updatedCompany.documents
    };
  }
}
