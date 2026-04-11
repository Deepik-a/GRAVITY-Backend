import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetAllBookingsUseCase } from "@/application/interfaces/use-cases/admin/IGetAllBookingsUseCase";

@injectable()
export class GetAllBookingsUseCase implements IGetAllBookingsUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(page = 1, limit = 10, search = ""): Promise<{ bookings: IBooking[]; total: number }> {
    return await this._bookingRepository.getAllBookingsPaged(page, limit, search);
  }
}
