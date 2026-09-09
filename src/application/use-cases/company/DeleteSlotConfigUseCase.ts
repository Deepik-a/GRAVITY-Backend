import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { IDeleteSlotConfigUseCase } from "@/application/interfaces/use-cases/company/IDeleteSlotConfigUseCase";

@injectable()
export class DeleteSlotConfigUseCase implements IDeleteSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(companyId: string, ruleId?: string): Promise<boolean> {
    if (ruleId) {
      const rule = await this._slotRepository.getConfigById(ruleId);
      if (!rule || rule.companyId !== companyId) {
        throw new AppError("Slot rule not found.", StatusCode.NOT_FOUND);
      }

      // Check for active bookings within this rule's date range
      const bookings = await this._bookingRepository.getCompanyBookings(companyId);
      const ruleStart = new Date(rule.startDate);
      const ruleEnd = new Date(rule.endDate);

      const hasActiveBookings = bookings.some((b: IBooking) => {
        const bDate = new Date(b.date);
        return bDate >= ruleStart && bDate <= ruleEnd && b.status === "confirmed";
      });

      if (hasActiveBookings) {
        throw new AppError(
          "Cannot delete this slot rule because it has confirmed bookings.",
          StatusCode.BAD_REQUEST
        );
      }
    }

    return await this._slotRepository.deleteConfig(companyId, ruleId);
  }
}
