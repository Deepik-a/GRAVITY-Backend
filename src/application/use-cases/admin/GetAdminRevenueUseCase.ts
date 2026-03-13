import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";

import { AdminRevenueResponseDto } from "@/application/dtos/admin/AdminRevenueResponseDto";
import { IGetAdminRevenueUseCase } from "@/application/interfaces/use-cases/admin/IGetAdminRevenueUseCase";

@injectable()
export class GetAdminRevenueUseCase implements IGetAdminRevenueUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository
  ) {}

  async execute(): Promise<AdminRevenueResponseDto> {
    const bookings = await this._bookingRepository.getAllBookings();
    const paidBookings = bookings.filter(b => b.paymentStatus === "paid");
    
    // Revenue logic:
    // Total collected: sum of price
    // Admin share: sum of adminCommission (or 10% of price)
    // To Company: sum of (price - adminCommission)
    
    // Assuming price includes commission.
    const totalCollected = paidBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    const adminShare = paidBookings.reduce((sum, b) => sum + (b.adminCommission || (b.price || 0) * 0.1), 0);
    const totalCompanyShare = totalCollected - adminShare;

    return {
      totalRevenue: adminShare, // Admin's actual revenue
      bookings: paidBookings,
      totalCompanyShare
    };
  }
}
