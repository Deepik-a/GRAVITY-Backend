import { IUpdateCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IUpdateCompanyProfileUseCase";
import { IDeleteCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IDeleteCompanyProfileUseCase";
import { IGetCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyProfileUseCase";
import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { StatusCode } from "@/domain/enums/StatusCode";
import { ILogger } from "@/domain/services/ILogger";
import { IStorageService } from "@/domain/services/IStorageService";

@injectable()
export class CompanyProfileController {
  constructor(
    @inject(TYPES.UpdateCompanyProfileUseCase) private readonly _updateProfileUseCase: IUpdateCompanyProfileUseCase,
    @inject(TYPES.DeleteCompanyProfileUseCase) private readonly _deleteProfileUseCase: IDeleteCompanyProfileUseCase,
    @inject(TYPES.GetCompanyProfileUseCase) private readonly _getProfileUseCase: IGetCompanyProfileUseCase,
    @inject(TYPES.StorageService) private readonly _storageService: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Get profile endpoint hit");
    try {
      const { companyId } = req.params;
      if (!companyId) {
        return res.status(StatusCode.BAD_REQUEST).json({ message: "Company ID is required" });
      }

      const result = await this._getProfileUseCase.execute(companyId);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      this._logger.error("🔥 Get profile error:", { error: err });
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Update profile endpoint hit");
    try {
      const { companyId, profileData } = req.body;
      if (!companyId || !profileData) {
        return res.status(StatusCode.BAD_REQUEST).json({ message: "Company ID and Profile Data are required" });
      }

      const result = await this._updateProfileUseCase.execute(companyId, profileData);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      this._logger.error("🔥 Update profile error:", { error: err });
      next(err);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Upload profile image endpoint hit");
    try {
      const file = req.file;
      if (!file) {
        return res.status(StatusCode.BAD_REQUEST).json({ message: "No image file provided" });
      }

      const key = await this._storageService.uploadFile(file);
      const signedUrl = await this._storageService.getSignedUrl(key);
      return res.status(StatusCode.SUCCESS).json({ url: signedUrl });
    } catch (err) {
      this._logger.error("🔥 Upload profile image error:", { error: err });
      next(err);
    }
  }

  async deleteProfile(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Delete profile endpoint hit");
    try {
      const { companyId } = req.body;
      if (!companyId) {
        return res.status(StatusCode.BAD_REQUEST).json({ message: "Company ID is required" });
      }

      const result = await this._deleteProfileUseCase.execute(companyId);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      this._logger.error("🔥 Delete profile error:", { error: err });
      next(err);
    }
  }
}
