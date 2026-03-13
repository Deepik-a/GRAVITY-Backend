import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { IToggleCompanyBlockStatusUseCase } from "@/application/interfaces/use-cases/admin/IToggleCompanyBlockStatusUseCase";
import { ToggleBlockStatusRequestDto } from "@/application/dtos/admin/ToggleBlockStatusRequestDto";
import { ICompany } from "@/domain/entities/Company";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class ToggleCompanyBlockStatusUseCase implements IToggleCompanyBlockStatusUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: ICompanyRepository
  ) {}

  async execute(data: ToggleBlockStatusRequestDto): Promise<ICompany> {
    const { id, isBlocked } = data;
    
    const updatedCompany = await this._companyRepository.updateBlockStatus(id, isBlocked);

    if (!updatedCompany) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    return updatedCompany;
  }
}
