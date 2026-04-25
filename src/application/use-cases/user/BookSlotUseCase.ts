import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { NotificationService } from "@/application/services/NotificationService";

import { IBookSlotUseCase } from "@/application/interfaces/use-cases/user/IBookSlotUseCase";
import { Messages } from "@/shared/constants/message";


@injectable()
export class BookSlotUseCase implements IBookSlotUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(bookingData: IBooking): Promise<IBooking> {
    const { companyId, date, startTime } = bookingData;

    // 1. Verify Slot is actually available
    const bookingDate = new Date(bookingData.date);
    const config = await this._slotRepository.getConfigForCompanyOnDate(companyId, bookingDate);
    if (!config) throw new AppError(Messages.SLOT.CONFIG_NOT_FOUND, StatusCode.NOT_FOUND);

    // 2. Prevent booking past slots
    const now = new Date();
    if (bookingDate.toDateString() === now.toDateString()) {
      const [h, m] = startTime.split(":").map(Number);
      const slotMins = h * 60 + m;
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (slotMins <= currentMins) {
        throw new AppError(Messages.SLOT.SLOT_PASSED_TODAY, StatusCode.BAD_REQUEST);
      }
    } else if (bookingDate < now) {
       throw new AppError(Messages.SLOT.PAST_SLOT_BOOKING, StatusCode.BAD_REQUEST);
    }

    // IMPORTANT: Check for existing bookings to prevent E11000 duplicate key error
    // If a booking exists for this slot (even if pending), we handle it.
    const existing = await this._bookingRepository.findOneBooking(companyId, date, startTime);

    if (existing) {
      if (existing.status === "confirmed") {
        throw new AppError(Messages.SLOT.SLOT_ALREADY_TAKEN, StatusCode.CONFLICT);
      }
      
      if (existing.status === "pending") {
        if (existing.userId === bookingData.userId) {
          // It's the same user trying again (e.g., retrying payment after cancel)
          // We return the existing booking instead of creating a new one to avoid DB error.
          return existing;
        } else {
          // Someone else is in the middle of paying for this slot.
          throw new AppError(Messages.SLOT.SLOT_PAYMENT_IN_PROGRESS, StatusCode.CONFLICT);
        }
      }
    }

    // Calculate endTime
    const [h, m] = startTime.split(":").map(Number);
    const endMins = h * 60 + m + config.slotDuration;
    const endH = Math.floor(endMins / 60).toString().padStart(2, "0");
    const endM = (endMins % 60).toString().padStart(2, "0");
    
    bookingData.endTime = `${endH}:${endM}`;
    bookingData.status = "pending";

    // This may still throw E11000 if there's a "cancelled" booking in DB 
    // because the unique index doesn't exclude them. 
    // Partial indexes or hard deletes would be needed for that.
    let savedBooking: IBooking;
    try {
      savedBooking = await this._bookingRepository.createBooking(bookingData);
    } catch (error: unknown) {
      // Handle MongoDB duplicate key error (E11000)
     
      if (error instanceof Error && error.message.includes("E11000")) {
         console.log("hello error from me");
        throw new AppError(Messages.GENERIC.SERVER_ERROR, StatusCode.INTERNAL_ERROR);
      }
      throw error;
    }
    

    // Notify Company
    await this._notificationService.createNotification({
      recipientId: companyId,
      recipientType: "company",
      title: "New Booking Request",
      message: `You have a new booking request for ${new Date(date).toLocaleDateString()} at ${startTime}.`,
      type: "NEW_BOOKING",
    });

    return savedBooking;
  }
}
