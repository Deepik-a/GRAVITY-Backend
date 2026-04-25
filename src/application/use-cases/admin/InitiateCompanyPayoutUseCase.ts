import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

import { IInitiateCompanyPayoutUseCase } from "@/application/interfaces/use-cases/admin/IInitiateCompanyPayoutUseCase";

@injectable()
export class InitiateCompanyPayoutUseCase implements IInitiateCompanyPayoutUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository
  ) {}

  async execute(bookingId: string): Promise<boolean> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    
    if (booking.paymentStatus !== PaymentStatus.PAID) {
      throw new Error("Booking payment is not completed yet.");
    }
    
    if (booking.serviceStatus !== "completed") {
      throw new Error("Service must be marked as completed by the user before payout.");
    }

    if (booking.payoutStatus === "completed") {
      throw new Error("Payout already completed for this booking.");
    }

    // Find the pending payout transaction
    const transactions = await this._transactionRepository.findAll({ 
      bookingId, 
      type: "company_payout",
      status: "pending_transfer" 
    });

    if (transactions.length === 0) {
      throw new Error("No pending payout transaction found for this booking. Please ensure the user has marked it as completed.");
    }

    const payoutTransaction = transactions[0];
    const settlementAmount = payoutTransaction.amount;
    
    // 1. Update Booking payout status
    await this._bookingRepository.updateById(bookingId, { payoutStatus: "completed" });
    
    // 2. Add to Company Wallet
    const company = await this._companyRepository.findCompanyById(booking.companyId);
    if (!company) throw new Error("Company not found");
    
    const currentBalance = company.walletBalance || 0;
    const newBalance = currentBalance + settlementAmount;
    
    await this._companyRepository.update(booking.companyId, { walletBalance: newBalance });
    
    // 3. Update Transaction status
    if (payoutTransaction.id) {
      await this._transactionRepository.update(payoutTransaction.id, { 
        status: "completed",
        description: payoutTransaction.description + " (Confirmed by Admin)"
      });
    }
    
    return true;
  }
}
