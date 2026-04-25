import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IGetAllTransactionsUseCase, GetAllTransactionsFilters } from "@/application/interfaces/use-cases/admin/IGetAllTransactionsUseCase";
import { ILogger } from "@/domain/services/ILogger";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.GetAllTransactionsUseCase) private getAllTransactionsUseCase: IGetAllTransactionsUseCase,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { type, status, userId, companyId, startDate, endDate } = req.query;

      const filters: GetAllTransactionsFilters = {};

      if (type) filters.type = type as string;
      if (status) filters.status = status as string;
      if (userId) filters.userId = userId as string;
      if (companyId) filters.companyId = companyId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await this.getAllTransactionsUseCase.execute(filters);

      res.status(StatusCode.SUCCESS).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.logger.error("Error fetching transactions:", { error: error instanceof Error ? error.message : String(error) });
      res.status(StatusCode.INTERNAL_ERROR).json({
        success: false,
        message: "Failed to fetch transactions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
