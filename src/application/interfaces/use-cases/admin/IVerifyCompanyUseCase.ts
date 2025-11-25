// src/application/interfaces/use-cases/company/IVerifyCompanyUseCase.ts
import { ICompany } from "../../../../domain/entities/Company";

export interface IVerifyCompanyUseCase {

  execute(companyId: string, approve: boolean): Promise<ICompany>;
}
