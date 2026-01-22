import { injectable, inject } from "inversify";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ITransaction } from "@/domain/entities/Transaction";
import { TYPES } from "@/infrastructure/DI/types";

interface GetAllTransactionsFilters {
  type?: string;
  status?: string;
  userId?: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class GetAllTransactionsUseCase {
  constructor(
    @inject(TYPES.TransactionRepository) private transactionRepository: ITransactionRepository
  ) {}

  async execute(filters?: GetAllTransactionsFilters): Promise<{
    transactions: ITransaction[];
    totalRevenue: number;
    totalCommissions: number;
    revenueByType: { type: string; total: number }[];
  }> {
    const transactions = await this.transactionRepository.findAll(filters);
    const totalRevenue = await this.transactionRepository.getTotalRevenue();
    const totalCommissions = await this.transactionRepository.getTotalCommissions();
    const revenueByType = await this.transactionRepository.getRevenueByType();

    return {
      transactions,
      totalRevenue,
      totalCommissions,
      revenueByType,
    };
  }
}
