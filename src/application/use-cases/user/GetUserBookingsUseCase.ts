import { inject, injectable } from "inversify";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { TYPES } from "@/infrastructure/DI/types";
import { IBooking } from "@/domain/entities/Booking";

import { IGetUserBookingsUseCase } from "@/application/interfaces/use-cases/user/IGetUserBookingsUseCase";

@injectable()
export class GetUserBookingsUseCase implements IGetUserBookingsUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(userId: string, page = 1, limit = 10): Promise<{ bookings: IBooking[]; total: number }> {
    return await this._bookingRepository.getUserBookingsPaged(userId, page, limit);
  }
}
