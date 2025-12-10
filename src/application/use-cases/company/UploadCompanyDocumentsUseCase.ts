import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import { IStorageService } from "../../../domain/services/IStorageService";
import { IUploadCompanyDocumentsUseCase } from "../../interfaces/use-cases/company/IUploadCompanyDocumentsUseCase";
import { Messages } from "../../../shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
import { ILogger } from "../../../domain/services/ILogger"; 

@injectable()
export class UploadCompanyDocumentsUseCase
  implements IUploadCompanyDocumentsUseCase
{
  constructor(
    @inject(TYPES.StorageService)
    private readonly _storageService: IStorageService,

    @inject(TYPES.CompanyRepository)
    private readonly companyRepo: ICompanyRepository,

    @inject(TYPES.Logger)               
    private readonly logger: ILogger
  ) {}

  async execute(email: string, files: Express.Multer.File[]) {
    this.logger.info("Uploading documents initiated", { email });

    if (!files || files.length !== 3) {
      this.logger.warn("Invalid number of documents received", {
        email,
        received: files?.length || 0,
      });
      throw new Error("Exactly 3 documents are required");
    }

    try {
      // Upload to S3
      const uploadedUrls = await Promise.all(
        files.map((file) => this._storageService.uploadFile(file))
      );

      this.logger.info("Documents uploaded to S3", {
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
      const updatedCompany = await this.companyRepo.updateDocuments(
        email,
        uploadedDocs
      );

      if (!updatedCompany) {
        this.logger.error("Company not found for document update", { email });
        throw new Error("Company not found with this email");
      }

      await this.companyRepo.updateDocumentStatus({ email }, "pending");

      this.logger.info("Document status updated to pending", { email });

      return {
        message: Messages.COMPANY.UPLOAD_SUCCESS,
        urls: uploadedUrls,
      };
    } catch (error: any) {
      this.logger.error("Upload company documents failed", {
        email,
        error: error.message,
      });
      throw error;
    }
  }
}
