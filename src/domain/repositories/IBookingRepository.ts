import { IBooking } from "@/domain/entities/Booking";

export interface IBookingRepository {
  findById(id: string): Promise<IBooking | null>;
  updateById(id: string, updates: Partial<IBooking>): Promise<IBooking | null>;
  createBooking(booking: IBooking): Promise<IBooking>;
  getBookingsByCompanyAndDate(companyId: string, date: Date): Promise<IBooking[]>;
  getUserBookings(userId: string): Promise<IBooking[]>;
  getCompanyBookings(companyId: string): Promise<IBooking[]>;
  getAllBookings(): Promise<IBooking[]>;
  cancelBooking(bookingId: string): Promise<boolean>;
}
