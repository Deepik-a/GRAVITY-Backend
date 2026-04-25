import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { NotificationService } from "@/application/services/NotificationService";

import { ICompleteBookingUseCase } from "@/application/interfaces/use-cases/user/ICompleteBookingUseCase";
import { Messages } from "@/shared/constants/message";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

@injectable()
export class CompleteBookingUseCase implements ICompleteBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(bookingId: string, userId: string) {
    const booking = await this._bookingRepository.findById(bookingId);
    
    if (!booking) {
      throw new Error(Messages.BOOKING.NOT_FOUND);
    }

    if (booking.userId.toString() !== userId) {
      throw new Error(Messages.BOOKING.UNAUTHORIZED);
    }

    if (booking.serviceStatus === "completed") {
      throw new Error(Messages.BOOKING.SERVICE_ALREADY_COMPLETED);
    }

    if (booking.paymentStatus !== PaymentStatus.PAID) {
      throw new Error(Messages.BOOKING.BOOKING_NOT_PAID);
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

    // Note: 'company_payout' transaction is already created in StripeWebhookUseCase 
    // with 'pending_transfer' status when the booking is paid.

    // Notify Company
    await this._notificationService.createNotification({
      recipientId: booking.companyId,
      recipientType: "company",
      title: Messages.NOTIFICATION.BOOKING_COMPLETED_TITLE,
      message: Messages.NOTIFICATION.BOOKING_COMPLETED_MESSAGE
        .replace("{date}", new Date(booking.date).toLocaleDateString())
        .replace("{amount}", settlementAmount.toString()),
      type: "BOOKING_COMPLETED",
    });

    return {
      success: true,
      message: Messages.BOOKING.COMPLETE_SUCCESS,
      settlementAmount,
      platformFee
    };
  }
}
