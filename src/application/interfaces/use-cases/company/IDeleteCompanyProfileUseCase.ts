import { ICompany } from "@/domain/entities/Company";

export interface IDeleteCompanyProfileUseCase {
  execute(companyId: string): Promise<ICompany>;
}
