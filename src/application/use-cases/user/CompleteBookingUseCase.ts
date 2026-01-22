import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";

@injectable()
export class CompleteBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(bookingId: string, userId: string) {
    const booking = await this._bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.userId.toString() !== userId) {
      throw new Error("Unauthorized to complete this booking");
    }

    if (booking.serviceStatus === "completed") {
      throw new Error("Service already marked as completed");
    }

    if (booking.paymentStatus !== "paid") {
      throw new Error("Cannot complete a booking that hasn't been paid for");
    }

    // Update booking status
    await this._bookingRepository.updateById(bookingId, {
      serviceStatus: "completed"
    });

    // Get company details to check subscription status
    const company = await this._companyRepository.findCompanyById(booking.companyId);
    const isSubscribed = company?.isSubscribed || false;

    // Calculate settlement: 5% fee if subscribed, 10% if not
    const grossAmount = booking.price || 0;
    const platformFeeRate = isSubscribed ? 5 : 10;
    const platformFee = grossAmount * (platformFeeRate / 100);
    const settlementAmount = grossAmount - platformFee;

    // Create settlement transaction record
    await this._transactionRepository.createTransaction({
      type: "company_payout",
      amount: settlementAmount,
      status: "pending_transfer",
      bookingId: bookingId,
      companyId: booking.companyId,
      description: `Settlement for booking ${bookingId} (${platformFeeRate}% platform fee)`,
      commissionRate: platformFeeRate,
      commissionAmount: platformFee,
      netAmount: settlementAmount
    });

    return {
      success: true,
      message: "Service marked as completed and settlement initiated",
      settlementAmount,
      platformFee
    };
  }
}
