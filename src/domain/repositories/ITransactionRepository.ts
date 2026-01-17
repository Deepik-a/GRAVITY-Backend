import { ITransaction } from "@/domain/entities/Transaction";

export interface ITransactionRepository {
  createTransaction(transaction: ITransaction): Promise<ITransaction>;
  findByCompanyId(companyId: string): Promise<ITransaction[]>;
  findAll(): Promise<ITransaction[]>;
}
