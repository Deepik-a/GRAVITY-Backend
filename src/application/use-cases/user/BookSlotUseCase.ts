import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IBookSlotUseCase } from "@/application/interfaces/use-cases/user/IBookSlotUseCase";


@injectable()
export class BookSlotUseCase implements IBookSlotUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository
  ) {}

  async execute(bookingData: IBooking): Promise<IBooking> {
    const { companyId, date, startTime } = bookingData;

    // 1. Verify Slot is actually available
    const config = await this._slotRepository.getConfigByCompanyId(companyId);
    if (!config) throw new AppError("Company has no slot configuration.", StatusCode.NOT_FOUND);

    // TODO: More rigorous verification (duration, weekdays etc.) could be added here
    // but for now we assume the frontend selects valid slots from GetAvailableSlots

    const isSlotAvailable = await this._bookingRepository.checkSlotAvailability(companyId, date, startTime);
    if (!isSlotAvailable) {
      throw new AppError("This slot has already been taken by someone else.", StatusCode.CONFLICT);
    }

  
    // Calculate endTime
    const [h, m] = startTime.split(":").map(Number);
    const endMins = h * 60 + m + config.slotDuration;
    const endH = Math.floor(endMins / 60).toString().padStart(2, "0");
    const endM = (endMins % 60).toString().padStart(2, "0");
    
    bookingData.endTime = `${endH}:${endM}`;
    bookingData.status = "pending";

    return await this._bookingRepository.createBooking(bookingData);
  }
}
