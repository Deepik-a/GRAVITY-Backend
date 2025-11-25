import { ICompanyRepository } from "../../../domain/repositories/ICompanyRepository";
import { IStorageService } from "../../../domain/services/IStorageService";
import { IUploadCompanyDocumentsUseCase } from "../../interfaces/use-cases/company/IUploadCompanyDocumentsUseCase";
import { Messages } from "../../../shared/constants/message";

export class UploadCompanyDocumentsUseCase
  implements IUploadCompanyDocumentsUseCase
{
  constructor(
    private readonly _storageService: IStorageService,
    private readonly companyRepo: ICompanyRepository
  ) {}

  async execute(email: string, files: Express.Multer.File[]) {
    if (!files || files.length !== 3) {
      throw new Error("Exactly 3 documents are required");
    }

    // Upload files to S3
    const uploadedUrls = await Promise.all(
      files.map((file) => this._storageService.uploadFile(file))
    );

    // Map uploaded URLs to document keys
    const uploadedDocs = {
      GST_Certificate: uploadedUrls[0],
      RERA_License: uploadedUrls[1],
      Trade_License: uploadedUrls[2],
    };

    // Update DB using email instead of companyId
    const updatedCompany = await this.companyRepo.updateDocuments(email, uploadedDocs);

    if (!updatedCompany) {
      throw new Error("Company not found with this email");
    }

    // Set document status to 'pending'
    await this.companyRepo.updateDocumentStatus({email}, "pending");

    return {
      message: Messages.COMPANY.UPLOAD_SUCCESS,
      urls: uploadedUrls,
    };
  }
}
