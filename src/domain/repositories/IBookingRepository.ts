import { IBooking } from "@/domain/entities/Booking";

export interface IBookingRepository {
  createBooking(booking: IBooking): Promise<IBooking>;
  getBookingsByCompanyAndDate(companyId: string, date: Date): Promise<IBooking[]>;
  getUserBookings(userId: string): Promise<IBooking[]>;
  getCompanyBookings(companyId: string): Promise<IBooking[]>;
  cancelBooking(bookingId: string): Promise<boolean>;
}
