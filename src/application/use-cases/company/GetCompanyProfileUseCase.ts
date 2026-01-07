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

    return company;
  }
}
