import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { IStorageService } from "@/domain/services/IStorageService";
import { IUploadCompanyDocumentsUseCase } from "@/application/interfaces/use-cases/company/IUploadCompanyDocumentsUseCase";
import { UploadDocumentsRequestDto } from "@/application/dtos/company/UploadDocumentsRequestDto";
import { UploadDocumentsResponseDto } from "@/application/dtos/company/UploadDocumentsResponseDto";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger"; 
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class UploadCompanyDocumentsUseCase
  implements IUploadCompanyDocumentsUseCase
{
  constructor(
    @inject(TYPES.StorageService)
    private readonly _storageService: IStorageService,

    @inject(TYPES.CompanyRepository)
    private readonly _companyRepo: ICompanyRepository,

    @inject(TYPES.Logger)               
    private readonly _logger: ILogger
  ) {}

  async execute(dto: UploadDocumentsRequestDto): Promise<UploadDocumentsResponseDto> {
    const { email, files } = dto;
    this._logger.info("Uploading documents initiated", { email });

    if (!files || files.length !== 3) {
      this._logger.warn("Invalid number of documents received", {
        email,
        received: files?.length || 0,
      });
      throw new AppError(Messages.COMPANY.DOCUMENTS_REQUIRED, StatusCode.BAD_REQUEST);
    }

    try {
      // Upload to S3
      const uploadedUrls = await Promise.all(
        files.map((file) => this._storageService.uploadFile(file))
      );

      this._logger.info("Documents uploaded to S3", {
        email,
        urls: uploadedUrls,
      });

      // Map uploaded URLs
      const uploadedDocs = {
        GST_Certificate: uploadedUrls[0],
        RERA_License: uploadedUrls[1],
        Trade_License: uploadedUrls[2],
      };

      // Update DB
      const updatedCompany = await this._companyRepo.updateDocuments(
        email,
        uploadedDocs
      );

      if (!updatedCompany) {
        this._logger.error("Company not found for document update", { email });
        throw new AppError(Messages.COMPANY.COMPANY_NOT_FOUND_WITH_EMAIL, StatusCode.NOT_FOUND);
      }

      await this._companyRepo.updateDocumentStatus({ email }, "pending");

      this._logger.info("Document status updated to pending", { email });

      return {
        message: Messages.COMPANY.UPLOAD_SUCCESS,
        urls: uploadedUrls,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      this._logger.error("Upload company documents failed", {
        email,
        error: errorMessage,
      });
      throw error;
    }
  }
}
