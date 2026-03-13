import { ITransaction } from "@/domain/entities/Transaction";

export interface GetAllTransactionsFilters {
  type?: string;
  status?: string;
  userId?: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IGetAllTransactionsUseCase {
  execute(filters?: GetAllTransactionsFilters): Promise<{
    transactions: ITransaction[];
    totalRevenue: number;
    totalCommissions: number;
    revenueByType: { type: string; total: number }[];
  }>;
}
