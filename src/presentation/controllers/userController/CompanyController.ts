import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetVerifiedCompaniesUseCase } from "@/application/use-cases/user/GetVerifiedCompaniesUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class CompanyController {
  constructor(
    @inject(TYPES.GetVerifiedCompaniesUseCase) private _getVerifiedCompaniesUseCase: GetVerifiedCompaniesUseCase
  ) {}

  async getVerifiedCompanies(req: Request, res: Response): Promise<void> {
    try {
      const companies = await this._getVerifiedCompaniesUseCase.execute();
      res.status(StatusCode.SUCCESS).json(companies);
    } catch (error: unknown) {
      const err = error as Error;
      res.status(StatusCode.INTERNAL_ERROR).json({ message: err.message || "Failed to fetch companies" });
    }
  }
}
