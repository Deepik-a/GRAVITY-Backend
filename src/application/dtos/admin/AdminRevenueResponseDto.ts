import { IBooking } from "@/domain/entities/Booking";

export interface AdminRevenueResponseDto {
  totalRevenue: number;
  bookings: IBooking[];
  totalCompanyShare: number;
}
