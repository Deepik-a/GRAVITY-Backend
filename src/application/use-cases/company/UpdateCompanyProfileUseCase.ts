import { IUpdateCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IUpdateCompanyProfileUseCase";
import { ICompany } from "@/domain/entities/Company";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { Messages } from "@/shared/constants/message";

@injectable()
export class UpdateCompanyProfileUseCase implements IUpdateCompanyProfileUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany> {
    // 🔹 STRICT VALIDATION FOR CATEGORIES & SERVICES
    const allowedCategories = ["Residential", "Villas", "Commercial"];
    const allowedServices = ["Architecture", "Interior Design", "Renovation"];

    if (profileData.categories && profileData.categories.some(cat => !allowedCategories.includes(cat))) {
       throw new AppError(Messages.COMPANY.INVALID_CATEGORIES, StatusCode.BAD_REQUEST);
    }

    if (profileData.services && profileData.services.some(svc => !allowedServices.includes(svc))) {
       throw new AppError(Messages.COMPANY.INVALID_SERVICES, StatusCode.BAD_REQUEST);
    }

    const updatedCompany = await this._companyRepository.updateProfile(companyId, profileData);
    
    if (!updatedCompany) {
      throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    }

    return updatedCompany;
  }
}
