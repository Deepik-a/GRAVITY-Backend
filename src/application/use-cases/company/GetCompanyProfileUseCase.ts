import { IGetCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyProfileUseCase";
import { ICompany } from "@/domain/entities/Company";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class GetCompanyProfileUseCase implements IGetCompanyProfileUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string): Promise<ICompany> {
    const company = await this._companyRepository.getProfile(companyId);
    
    if (!company) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    if (company.isBlocked) {
       // If public is viewing a blocked company, return forbidden but with a different message 
       // than the one used for the requester's own block status to avoid interceptor issues.
       throw new AppError("This business account has been suspended.", StatusCode.FORBIDDEN);
    }

    return company;
  }
}
