import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetCompanyDashboardStatsUseCase } from "@/application/use-cases/company/GetCompanyDashboardStatsUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { ILogger } from "@/domain/services/ILogger";
import { AuthenticatedUser } from "@/types/auth";
import { Messages } from "@/shared/constants/message";

@injectable()
export class CompanyDashboardController {
  constructor(
    @inject(TYPES.GetCompanyDashboardStatsUseCase)
    private _getDashboardStatsUseCase: GetCompanyDashboardStatsUseCase,
    @inject(TYPES.Logger) private _logger: ILogger
  ) {}

  async getStats(req: Request, res: Response, next: NextFunction) {
    this._logger.info("📥 Get company dashboard stats endpoint hit");
    try {
      const companyId = (req.user as AuthenticatedUser)?.id;
      if (!companyId) {
        return res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
      }

      const stats = await this._getDashboardStatsUseCase.execute(companyId);
      return res.status(StatusCode.SUCCESS).json(stats);
    } catch (err) {
      this._logger.error("🔥 Get dashboard stats error:", { error: err });
      next(err);
    }
  }
}
