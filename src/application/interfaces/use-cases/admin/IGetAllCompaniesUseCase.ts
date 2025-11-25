// src/application/interfaces/use-cases/admin/IGetAllCompaniesUseCase.ts
import { ICompany } from "../../../../domain/entities/Company";

export interface IGetAllCompaniesUseCase {
  execute(): Promise<ICompany[]>;
}
