import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IRescheduleBookingUseCase } from "@/application/interfaces/use-cases/company/IRescheduleBookingUseCase";

@injectable()
export class RescheduleBookingUseCase implements IRescheduleBookingUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository
  ) {}

  async execute(bookingId: string, newDate: Date, newStartTime: string): Promise<void> {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", StatusCode.NOT_FOUND);
    }

    if (booking.status === "cancelled") {
      throw new AppError("Cannot reschedule a cancelled booking.", StatusCode.BAD_REQUEST);
    }

    // Verify Slot is actually available for this company on this date
    const config = await this._slotRepository.getConfigByCompanyId(booking.companyId);
    if (!config) {
      throw new AppError("Company has no slot configuration.", StatusCode.NOT_FOUND);
    }

    // Check if the slot is already booked
    const alreadyBooked = await this._bookingRepository.getBookingsByCompanyAndDate(booking.companyId, newDate);
    if (alreadyBooked.some(b => b.startTime === newStartTime && b.id !== bookingId)) {
      throw new AppError("This slot is already booked.", StatusCode.CONFLICT);
    }

    // Calculate new endTime
    const [h, m] = newStartTime.split(":").map(Number);
    const endMins = h * 60 + m + config.slotDuration;
    const endH = Math.floor(endMins / 60).toString().padStart(2, "0");
    const endM = (endMins % 60).toString().padStart(2, "0");
    const newEndTime = `${endH}:${endM}`;

    // Update booking
    await this._bookingRepository.updateById(bookingId, {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      isRescheduled: true
    });
  }
}
