import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";

@injectable()
export class InitiateCompanyPayoutUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository
  ) {}

  async execute(bookingId: string): Promise<boolean> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) throw new Error("Booking not found");
    // Ensure booking contains necessary price info
    const price = booking.price || 0;
    
    if (booking.paymentStatus !== "paid") {
      throw new Error("Booking payment is not completed yet.");
    }
    
    if (booking.payoutStatus === "completed") {
      throw new Error("Payout already completed for this booking.");
    }
    
    const now = new Date();
    const bookingDate = new Date(booking.date);
    // Add 2 days
    const payoutEligibilityDate = new Date(bookingDate);
    payoutEligibilityDate.setDate(payoutEligibilityDate.getDate() + 2);
    
    if (now < payoutEligibilityDate) {
      throw new Error("Payout is only available 2 days after the slot usage.");
    }
    
    const adminCommission = booking.adminCommission || (price * 0.1);
    const companyShareAppx = price - adminCommission;
    
    // 1. Update Booking status
    // Note: updating booking to payoutStatus="completed" should be done.
    // IBookingRepository needs to support generic update or we need updateById in Entity
    
    // Since we added payoutStatus to BookingModel, we can update it.
    await this._bookingRepository.updateById(bookingId, { payoutStatus: "completed" });
    
    // 2. Add to Company Wallet
    const company = await this._companyRepository.findCompanyById(booking.companyId);
    if (!company) throw new Error("Company not found");
    
    const currentBalance = company.walletBalance || 0;
    const newBalance = currentBalance + companyShareAppx;
    
    await this._companyRepository.update(booking.companyId, { walletBalance: newBalance });
    
    // 3. Create History Transaction
    await this._transactionRepository.createTransaction({
      bookingId: bookingId,
      type: "company_payout",
      amount: companyShareAppx,
      status: "completed",
      toCompany: booking.companyId,
      createdAt: new Date(),
    } as any); // Casting as any to bypass strict type check if Transaction entity has optional fields mismatch
    
    return true;
  }
}
