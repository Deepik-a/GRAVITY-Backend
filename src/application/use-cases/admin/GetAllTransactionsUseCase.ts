import { injectable, inject } from "inversify";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ITransaction } from "@/domain/entities/Transaction";
import { TYPES } from "@/infrastructure/DI/types";



import { IGetAllTransactionsUseCase, GetAllTransactionsFilters } from "@/application/interfaces/use-cases/admin/IGetAllTransactionsUseCase";

@injectable()
export class GetAllTransactionsUseCase implements IGetAllTransactionsUseCase {
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
