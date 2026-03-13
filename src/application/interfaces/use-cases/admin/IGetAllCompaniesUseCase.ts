// src/application/interfaces/use-cases/admin/IGetAllCompaniesUseCase.ts
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";
// import { GetAllCompaniesRequestDto } from "@/application/dtos/admin/GetAllCompaniesRequestDto";

export interface IGetAllCompaniesUseCase {
  execute(): Promise<CompanyResponseDto[]>;
}
