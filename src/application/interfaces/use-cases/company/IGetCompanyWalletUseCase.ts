import { ITransaction } from "@/domain/entities/Transaction";

export interface IGetCompanyWalletUseCase {
  execute(companyId: string): Promise<{ 
    balance: number; 
    transactions: ITransaction[]; 
  }>;
}
