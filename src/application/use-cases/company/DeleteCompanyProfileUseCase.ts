import { IDeleteCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IDeleteCompanyProfileUseCase";
import { ICompany } from "@/domain/entities/Company";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class DeleteCompanyProfileUseCase implements IDeleteCompanyProfileUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string): Promise<ICompany> {
    const updatedCompany = await this._companyRepository.deleteProfile(companyId);
    
    if (!updatedCompany) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    return updatedCompany;
  }
}
