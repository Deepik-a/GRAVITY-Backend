import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { NotificationService } from "@/application/services/NotificationService";
import { ICancelBookingUseCase } from "@/application/interfaces/use-cases/company/ICancelBookingUseCase";

@injectable()
export class CancelBookingUseCase implements ICancelBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(companyId: string, bookingId: string): Promise<void> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", StatusCode.NOT_FOUND);
    }

    if (booking.companyId !== companyId) {
      throw new AppError("Unauthorized.", StatusCode.FORBIDDEN);
    }

    if (booking.status === "cancelled") {
      throw new AppError("Booking is already cancelled.", StatusCode.BAD_REQUEST);
    }

    const now = new Date();
    const createdAtStr = booking.createdAt || new Date();
    const createdAt = createdAtStr instanceof Date ? createdAtStr : new Date(createdAtStr);
    const msSinceCreation = now.getTime() - createdAt.getTime();
    
    // Check if within 24 hours (24 * 60 * 60 * 1000 = 86400000 ms)
    if (msSinceCreation > 86400000) {
      throw new AppError("Bookings can only be cancelled within 24 hours of creation.", StatusCode.BAD_REQUEST);
    }

    // Attempt cancellation
    const isCancelled = await this._bookingRepository.cancelBooking(bookingId);
    if (!isCancelled) {
      throw new AppError("Failed to cancel booking.", StatusCode.INTERNAL_ERROR);
    }

    // Also update to trigger refund needed (e.g. paymentStatus handling via admin, payoutStatus won't matter now)
    await this._bookingRepository.updateById(bookingId, { 
      // Mark for manual refund by admin or we can just leave it as is and admin checks it
    });

    // Notify User
    await this._notificationService.createNotification({
      recipientId: booking.userId,
      recipientType: "user",
      title: "Booking Cancelled",
      message: `Your booking for ${new Date(booking.date).toLocaleDateString()} at ${booking.startTime} has been cancelled by the consultant. The amount will be refunded to your wallet.`,
      type: "BOOKING_CANCELLED",
    });
  }
}
