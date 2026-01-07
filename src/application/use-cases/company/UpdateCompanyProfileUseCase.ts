import { IUpdateCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IUpdateCompanyProfileUseCase";
import { ICompany } from "@/domain/entities/Company";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class UpdateCompanyProfileUseCase implements IUpdateCompanyProfileUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany> {
    const updatedCompany = await this._companyRepository.updateProfile(companyId, profileData);
    
    if (!updatedCompany) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    return updatedCompany;
  }
}
