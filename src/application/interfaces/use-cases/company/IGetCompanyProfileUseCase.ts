import { ICompany } from "@/domain/entities/Company";

export interface IGetCompanyProfileUseCase {
  execute(companyId: string): Promise<ICompany>;
}
