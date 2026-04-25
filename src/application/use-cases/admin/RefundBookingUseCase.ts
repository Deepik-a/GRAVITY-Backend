import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { NotificationService } from "@/application/services/NotificationService";
import UserModel from "@/infrastructure/database/models/UserModel";
import TransactionModel from "@/infrastructure/database/models/TransactionModel";
import { Types } from "mongoose";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

export interface IRefundBookingUseCase {
  execute(bookingId: string): Promise<void>;
}

@injectable()
export class RefundBookingUseCase implements IRefundBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(bookingId: string): Promise<void> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", StatusCode.NOT_FOUND);
    }

    if (booking.status !== "cancelled") {
      throw new AppError("Only cancelled bookings can be refunded.", StatusCode.BAD_REQUEST);
    }

    if (booking.paymentStatus === PaymentStatus.REFUNDED) {
      throw new AppError("Booking is already refunded.", StatusCode.BAD_REQUEST);
    }

    const refundAmount = booking.price || 0;
    
    // Refund logic without Stripe. Add directly to User wallet.
    const user = await UserModel.findById(booking.userId);
    if (!user) {
      throw new AppError("User not found.", StatusCode.NOT_FOUND);
    }

    user.walletBalance = (user.walletBalance || 0) + refundAmount;
    await user.save();

    // Create a transaction record to note the refund
    await TransactionModel.create({
      type: "booking_payment",
      amount: refundAmount,
      status: "completed",
      bookingId: new Types.ObjectId(booking.id),
      userId: new Types.ObjectId(booking.userId),
      companyId: new Types.ObjectId(booking.companyId),
      description: "Refund for cancelled booking",
      netAmount: refundAmount,
    });

    // Update booking payment status
    await this._bookingRepository.updateById(bookingId, { 
      paymentStatus: PaymentStatus.REFUNDED
    });

    // Notify User
    await this._notificationService.createNotification({
      recipientId: booking.userId,
      recipientType: "user",
      title: "Booking Refunded",
      message: `Your cancelled booking's amount of ₹${booking.price} has been refunded to your wallet.`,
      type: "BOOKING_REFUNDED",
    });
  }
}
