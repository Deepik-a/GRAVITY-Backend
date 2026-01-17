import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetAllBookingsUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(): Promise<IBooking[]> {
    return await this._bookingRepository.getAllBookings();
  }
}
