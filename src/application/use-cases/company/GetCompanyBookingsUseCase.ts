import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetCompanyBookingsUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyBookingsUseCase";

@injectable()
export class GetCompanyBookingsUseCase implements IGetCompanyBookingsUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(companyId: string): Promise<IBooking[]> {
    return await this._bookingRepository.getCompanyBookings(companyId);
  }
}
