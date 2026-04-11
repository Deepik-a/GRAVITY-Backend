import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IGetAvailableSlotsUseCase } from "@/application/interfaces/use-cases/user/IGetAvailableSlotsUseCase";

@injectable()
export class GetAvailableSlotsUseCase implements IGetAvailableSlotsUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(companyId: string, dateStr: string): Promise<string[]> {
    const date = new Date(dateStr);
    const config = await this._slotRepository.getConfigByCompanyId(companyId);

    if (!config) {
      throw new AppError("No slot configuration found for this company.", StatusCode.NOT_FOUND);
    }

    // 1. Basic Date Checks
    if (date < config.startDate || date > config.endDate) return [];

    const dayName = date.toLocaleString("en-US", { weekday: "long" });
    if (!config.weekdays.includes(dayName)) return [];

    const isExceptional = config.exceptionalDays.some(ex => 
      new Date(ex).toDateString() === date.toDateString()
    );
    if (isExceptional) return [];

    // 2. Generate Potential Slots
    const potentialSlots = this.generateSlots(config);

    // 3. Filter Past Slots if date is Today
    const now = new Date();
    
    // Robust today check: Parse dateStr components to avoid UTC/Local timezone shifts
    const [y, m, d] = dateStr.split("-").map(Number);
    const isToday = now.getFullYear() === y && 
                    (now.getMonth() + 1) === m && 
                    now.getDate() === d;
    
    let futureSlots = potentialSlots;
    if (isToday) {
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();

      futureSlots = potentialSlots.filter(time => {
        const [h, min] = time.split(":").map(Number);
        const slotTotalMins = h * 60 + min;
        return slotTotalMins > currentTotalMins;
      });
    }

    // 4. Filter Booked Slots - ONLY exclude confirmed (paid) ones 
    // to allow "first to pay" behavior for concurrent pending bookings.
    const bookedBookings = await this._bookingRepository.getBookingsByCompanyAndDate(companyId, date, ["confirmed"]);
    const bookedTimes = bookedBookings.map(b => b.startTime);


    return futureSlots.filter(time => !bookedTimes.includes(time));
  }

  private generateSlots(config: ISlotConfig): string[] {
    const slots: string[] = [];
    const [startH, startM] = config.startTime.split(":").map(Number);
    const [endH, endM] = config.endTime.split(":").map(Number);

    let currentMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    while (currentMins + config.slotDuration <= endMins) {
      const h = Math.floor(currentMins / 60).toString().padStart(2, "0");
      const m = (currentMins % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);

      currentMins += config.slotDuration + config.bufferTime;
    }

    return slots;
  }
}
