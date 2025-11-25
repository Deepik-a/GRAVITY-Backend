// src/application/interfaces/use-cases/company/IUploadCompanyDocumentsUseCase.ts
export interface IUploadCompanyDocumentsUseCase {
  execute(
    email: string,                // changed from companyId to email
    files: Express.Multer.File[]
  ): Promise<{
    message: string;
    urls: string[];
  }>;
}
