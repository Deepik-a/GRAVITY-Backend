import { IUploadCompanyDocumentsUseCase } from
  "../../../application/interfaces/use-cases/company/IUploadCompanyDocumentsUseCase";
import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../../../domain/enums/StatusCode";
import { Messages } from "../../../shared/constants/message";

export class CompanyDocumentController {
  constructor(
    private readonly _uploadDocsUseCase: IUploadCompanyDocumentsUseCase
  ) {}

  async upload(req: Request, res: Response, next: NextFunction) {
    console.log("📥 Upload endpoint hit");

    try {
      // Get email from req.body instead of companyId from params
      const email = req.body.email;
      if (!email) {
        return res.status(StatusCode.BAD_REQUEST).json({
          message: "Email is required to identify the company",
        });
      }

      const files = req.files as Express.Multer.File[];
      console.log("📎 Files received:", files?.length);

      if (!files || files.length !== 3) {
        return res.status(StatusCode.BAD_REQUEST).json({
          message: "Exactly 3 documents are required",
        });
      }

      files.forEach((file, index) =>
        console.log(`📄 File ${index + 1}:`, file.originalname)
      );

      // Call use case with email instead of companyId
      const result = await this._uploadDocsUseCase.execute(email, files);

      console.log("✅ Files uploaded successfully", result);

      return res.status(StatusCode.SUCCESS).json({
        message: Messages.COMPANY.UPLOAD_SUCCESS,
        documents: result,
      });

    } catch (err) {
      console.error("🔥 Controller error:", err);
      next(err);
    }
  }
}


