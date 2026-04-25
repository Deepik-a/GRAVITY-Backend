import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IGetVerifiedCompaniesUseCase } from "@/application/interfaces/use-cases/user/IGetVerifiedCompaniesUseCase";
import { IGetCompanyProfileUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyProfileUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { GetPublicStatsUseCase } from "@/application/use-cases/GetPublicStatsUseCase";




@injectable()
export class CompanyController {
  constructor(
    @inject(TYPES.GetVerifiedCompaniesUseCase) private _getVerifiedCompaniesUseCase: IGetVerifiedCompaniesUseCase,
    @inject(TYPES.GetPublicStatsUseCase) private _getPublicStatsUseCase: GetPublicStatsUseCase,
    @inject(TYPES.GetCompanyProfileUseCase) private readonly _getProfileUseCase: IGetCompanyProfileUseCase,
  ) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      if (!companyId) {
        res.status(StatusCode.BAD_REQUEST).json({ message: "Company ID is required" });
        return;
      }

      const result = await this._getProfileUseCase.execute(companyId as string);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(StatusCode.INTERNAL_ERROR).json({ message: err.message || "Failed to fetch company profile" });
    }
  }

  async getPublicStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this._getPublicStatsUseCase.execute();
      res.status(StatusCode.SUCCESS).json(stats);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(StatusCode.INTERNAL_ERROR).json({ message: err.message || "Failed to fetch stats" });
    }
  }

  async getVerifiedCompanies(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        page = 1,
        limit = 6,
        category,
        services,
        companySize,
        minPrice,
        maxPrice,
        minExperience,
        sortBy,
        sortOrder,
      } = req.query;

      const params = {
        query: query as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        category: category ? (Array.isArray(category) ? category : [category]) as string[] : undefined,
        services: services ? (Array.isArray(services) ? services : [services]) as string[] : undefined,
        companySize: companySize as string,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
        minExperience: minExperience ? parseInt(minExperience as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
      };

      const result = await this._getVerifiedCompaniesUseCase.execute(params);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(StatusCode.INTERNAL_ERROR).json({ message: err.message || "Failed to fetch companies" });
    }
  }
}
