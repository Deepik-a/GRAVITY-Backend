import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";

import { IGetCompanyWalletUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyWalletUseCase";
import { ITransaction } from "@/domain/entities/Transaction";

@injectable()
export class GetCompanyWalletUseCase implements IGetCompanyWalletUseCase {
  constructor(
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository
  ) {}

  async execute(companyId: string): Promise<{ balance: number, transactions: ITransaction[] }> {
    const company = await this._companyRepository.findCompanyById(companyId);
    const transactions = await this._transactionRepository.findByCompanyId(companyId);
    
    return {
      balance: company?.walletBalance || 0,
      transactions
    };
  }
}
