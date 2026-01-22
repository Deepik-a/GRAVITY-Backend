import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetAllTransactionsUseCase } from "@/application/use-cases/admin/GetAllTransactionsUseCase";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class TransactionController {
  constructor(
    @inject(TYPES.GetAllTransactionsUseCase) private getAllTransactionsUseCase: GetAllTransactionsUseCase,
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { type, status, userId, companyId, startDate, endDate } = req.query;

      const filters: {
        type?: string;
        status?: string;
        userId?: string;
        companyId?: string;
        startDate?: Date;
        endDate?: Date;
      } = {};

      if (type) filters.type = type as string;
      if (status) filters.status = status as string;
      if (userId) filters.userId = userId as string;
      if (companyId) filters.companyId = companyId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await this.getAllTransactionsUseCase.execute(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      this.logger.error("Error fetching transactions:", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to fetch transactions",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
