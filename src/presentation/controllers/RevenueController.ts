import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IGetAdminRevenueUseCase } from "@/application/interfaces/use-cases/admin/IGetAdminRevenueUseCase";
import { IInitiateCompanyPayoutUseCase } from "@/application/interfaces/use-cases/admin/IInitiateCompanyPayoutUseCase";
import { IGetCompanyWalletUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyWalletUseCase";

import { AuthenticatedUser } from "@/types/auth";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class RevenueController {
  constructor(
    @inject(TYPES.GetAdminRevenueUseCase) private _getAdminRevenueUseCase: IGetAdminRevenueUseCase,
    @inject(TYPES.InitiateCompanyPayoutUseCase) private _initiateCompanyPayoutUseCase: IInitiateCompanyPayoutUseCase,
    @inject(TYPES.GetCompanyWalletUseCase) private _getCompanyWalletUseCase: IGetCompanyWalletUseCase
  ) {}

  async getAdminRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this._getAdminRevenueUseCase.execute();
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  }

  async initiatePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await this._initiateCompanyPayoutUseCase.execute(id as string);
      res.status(StatusCode.SUCCESS).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req.params.companyId as string) || (req.user as AuthenticatedUser)?.id;
      const result = await this._getCompanyWalletUseCase.execute(companyId);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  }
}
