import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetAdminRevenueUseCase } from "@/application/use-cases/admin/GetAdminRevenueUseCase";
import { InitiateCompanyPayoutUseCase } from "@/application/use-cases/admin/InitiateCompanyPayoutUseCase";
import { GetCompanyWalletUseCase } from "@/application/use-cases/company/GetCompanyWalletUseCase";

@injectable()
export class RevenueController {
  constructor(
    @inject(TYPES.GetAdminRevenueUseCase) private _getAdminRevenueUseCase: GetAdminRevenueUseCase,
    @inject(TYPES.InitiateCompanyPayoutUseCase) private _initiateCompanyPayoutUseCase: InitiateCompanyPayoutUseCase,
    @inject(TYPES.GetCompanyWalletUseCase) private _getCompanyWalletUseCase: GetCompanyWalletUseCase
  ) {}

  async getAdminRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this._getAdminRevenueUseCase.execute();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async initiatePayout(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const result = await this._initiateCompanyPayoutUseCase.execute(bookingId);
      res.status(200).json({ success: result });
    } catch (error) {
      next(error);
    }
  }

  async getCompanyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.params.companyId || (req as any).user?.id;
      const result = await this._getCompanyWalletUseCase.execute(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
