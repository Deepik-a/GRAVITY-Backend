import { ICompany } from "@/domain/entities/Company";

export interface IUpdateCompanyProfileUseCase {
  execute(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany>;
}
