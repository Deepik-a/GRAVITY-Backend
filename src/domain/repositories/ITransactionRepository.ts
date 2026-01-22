import { ITransaction } from "@/domain/entities/Transaction";

export interface ITransactionRepository {
  createTransaction(transaction: ITransaction): Promise<ITransaction>;
  findTransactionById(id: string): Promise<ITransaction | null>;
  findByCompanyId(companyId: string): Promise<ITransaction[]>;
  findByUserId(userId: string): Promise<ITransaction[]>;
  findAll(filters?: {
    type?: string;
    status?: string;
    userId?: string;
    companyId?: string;
    bookingId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ITransaction[]>;
  update(id: string, transaction: Partial<ITransaction>): Promise<ITransaction | null>;
  delete(id: string): Promise<boolean>;
  
  // Analytics methods
  getTotalRevenue(): Promise<number>;
  getTotalCommissions(): Promise<number>;
  getRevenueByType(): Promise<{ type: string; total: number }[]>;
}

