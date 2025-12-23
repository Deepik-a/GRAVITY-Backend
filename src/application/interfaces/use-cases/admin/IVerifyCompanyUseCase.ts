// src/application/interfaces/use-cases/company/IVerifyCompanyUseCase.ts
import { VerifyCompanyRequestDto } from "@/application/dtos/admin/VerifyCompanyRequestDto";
import { CompanyResponseDto } from "@/application/dtos/admin/CompanyResponseDto";

export interface IVerifyCompanyUseCase {
execute(dto: VerifyCompanyRequestDto): Promise<CompanyResponseDto>
}
