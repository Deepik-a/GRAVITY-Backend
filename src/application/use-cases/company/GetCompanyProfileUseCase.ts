import { IGetCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyProfileUseCase";
import { ICompany } from "@/domain/entities/Company";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { Messages } from "@/shared/constants/message";

@injectable()
export class GetCompanyProfileUseCase implements IGetCompanyProfileUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string): Promise<ICompany> {
    const company = await this._companyRepository.getProfile(companyId);
    
    if (!company) {
      throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    }

    if (company.isBlocked) {
       // If public is viewing a blocked company, return forbidden but with a different message 
       // than the one used for the requester's own block status to avoid interceptor issues.
       throw new AppError(Messages.COMPANY.BUSINESS_SUSPENDED, StatusCode.FORBIDDEN);
    }

    return company;
  }
}
