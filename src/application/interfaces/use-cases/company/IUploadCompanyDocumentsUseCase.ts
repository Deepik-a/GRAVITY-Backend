// src/application/interfaces/use-cases/company/IUploadCompanyDocumentsUseCase.ts
import { UploadDocumentsRequestDto } from "@/application/dtos/company/UploadDocumentsRequestDto";
import { UploadDocumentsResponseDto } from "@/application/dtos/company/UploadDocumentsResponseDto";

export interface IUploadCompanyDocumentsUseCase {
  execute(dto: UploadDocumentsRequestDto): Promise<UploadDocumentsResponseDto>;
}
