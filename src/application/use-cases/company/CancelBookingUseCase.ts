import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { NotificationService } from "@/application/services/NotificationService";
import { ICancelBookingUseCase } from "@/application/interfaces/use-cases/company/ICancelBookingUseCase";
import { Messages } from "@/shared/constants/message";
import UserModel from "@/infrastructure/database/models/UserModel";
import TransactionModel from "@/infrastructure/database/models/TransactionModel";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

@injectable()
export class CancelBookingUseCase implements ICancelBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(companyId: string, bookingId: string): Promise<void> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(Messages.BOOKING.NOT_FOUND, StatusCode.NOT_FOUND);
    }

    if (booking.companyId !== companyId) {
      throw new AppError(Messages.BOOKING.UNAUTHORIZED, StatusCode.FORBIDDEN);
    }

    if (booking.status === "cancelled") {
      throw new AppError(Messages.COMPANY.BOOKING_ALREADY_CANCELLED, StatusCode.BAD_REQUEST);
    }

    const now = new Date();
    const createdAtStr = booking.createdAt || new Date();
    const createdAt = createdAtStr instanceof Date ? createdAtStr : new Date(createdAtStr);
    const msSinceCreation = now.getTime() - createdAt.getTime();
    
    // Check if within 24 hours (24 * 60 * 60 * 1000 = 86400000 ms)
    if (msSinceCreation > 86400000) {
      throw new AppError(Messages.COMPANY.BOOKING_CANCEL_WINDOW_EXCEEDED, StatusCode.BAD_REQUEST);
    }

    // Attempt cancellation
    const isCancelled = await this._bookingRepository.cancelBooking(bookingId);
    if (!isCancelled) {
      throw new AppError(Messages.COMPANY.BOOKING_CANCEL_FAILED, StatusCode.INTERNAL_ERROR);
    }

    // Refund the full amount to user wallet if payment was completed
    console.log("Booking payment status:", booking.paymentStatus, "Price:", booking.price);
    if (booking.paymentStatus === PaymentStatus.PAID || booking.paymentStatus === PaymentStatus.PENDING) {
      const refundAmount = booking.price || 0;
      
      if (refundAmount > 0) {
        try {
          console.log("Attempting refund for user:", booking.userId, "Amount:", refundAmount);
          const user = await UserModel.findById(booking.userId);
          if (user) {
            console.log("User found, current balance:", user.walletBalance);
            user.walletBalance = (user.walletBalance || 0) + refundAmount;
            await user.save();
            console.log("User balance updated to:", user.walletBalance);

            // Create a transaction record to note the refund
            await TransactionModel.create({
              type: "booking_refund",
              amount: refundAmount,
              status: "completed",
              bookingId: booking.id,
              userId: booking.userId,
              companyId: booking.companyId,
              description: "Refund for booking cancelled by company",
              netAmount: refundAmount,
            });

            // Update booking payment status to refunded
            await this._bookingRepository.updateById(bookingId, { 
              paymentStatus: PaymentStatus.REFUNDED
            });
          } else {
            console.error("User not found for refund:", booking.userId);
          }
        } catch (refundError) {
          console.error("Refund failed during cancellation:", refundError);
          // Don't throw error - allow cancellation to proceed even if refund fails
          // Admin can manually refund later
        }
      } else {
        console.log("Refund amount is 0, skipping refund");
      }
    } else {
      console.log("Payment status is not PAID or PENDING, skipping refund. Status:", booking.paymentStatus);
    }

    // Notify User
    await this._notificationService.createNotification({
      recipientId: booking.userId,
      recipientType: "user",
      title: "Booking Cancelled",
      message: `Your booking for ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime} has been cancelled by the consultant. The amount has been refunded to your wallet.`,
      type: "BOOKING_CANCELLED",
    });
  }
}
