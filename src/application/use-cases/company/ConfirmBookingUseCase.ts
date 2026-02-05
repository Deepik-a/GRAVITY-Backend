import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { IConfirmBookingUseCase } from "@/application/interfaces/use-cases/company/IConfirmBookingUseCase";

@injectable()
export class ConfirmBookingUseCase implements IConfirmBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(bookingId: string): Promise<IBooking> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", StatusCode.NOT_FOUND);
    }

    if (booking.status !== "pending") {
      throw new AppError(`Cannot confirm booking with status: ${booking.status}`, StatusCode.BAD_REQUEST);
    }

    const updated = await this._bookingRepository.updateById(bookingId, { status: "confirmed" });
    if (!updated) {
      throw new AppError("Failed to update booking status", StatusCode.INTERNAL_ERROR);
    }

    return updated;
  }
}
