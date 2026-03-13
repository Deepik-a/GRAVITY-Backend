import { IUploadCompanyDocumentsUseCase } from
  "@/application/interfaces/use-cases/company/IUploadCompanyDocumentsUseCase";
import { UploadDocumentsRequestDto } from "@/application/dtos/company/UploadDocumentsRequestDto";
import { UploadDocumentsResponseDto } from "@/application/dtos/company/UploadDocumentsResponseDto";
import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { StatusCode } from "@/domain/enums/StatusCode";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class CompanyDocumentController {
  constructor(
    @inject(TYPES.UploadCompanyDocumentsUseCase) private readonly _uploadDocsUseCase: IUploadCompanyDocumentsUseCase,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  async upload(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Upload endpoint hit");

    try {
      const uploadDto: UploadDocumentsRequestDto = {
          email: req.body.email,
          files: req.files as Express.Multer.File[]
      };

      if (!uploadDto.email) {
        return res.status(StatusCode.BAD_REQUEST).json({
          message: "Email is required to identify the company",
        });
      }

      if (!uploadDto.files || uploadDto.files.length !== 3) {
        return res.status(StatusCode.BAD_REQUEST).json({
          message: "Exactly 3 documents are required",
        });
      }

      // Call use case with DTO
      const result: UploadDocumentsResponseDto = await this._uploadDocsUseCase.execute(uploadDto);

      this._logger.info("✅ Files uploaded successfully", { result });

      return res.status(StatusCode.SUCCESS).json(result);

    } catch (err) {
      this._logger.error("🔥 Controller error:", { error: err });
      next(err);
    }
  }
}


