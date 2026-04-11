import { IBooking } from "@/domain/entities/Booking";

export interface IBookingRepository {
  findById(id: string): Promise<IBooking | null>;
  updateById(id: string, updates: Partial<IBooking>): Promise<IBooking | null>;
  createBooking(booking: IBooking): Promise<IBooking>;
  getBookingsByCompanyAndDate(companyId: string, date: Date, statuses?: string[]): Promise<IBooking[]>;

  getUserBookingsPaged(userId: string, page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }>;
  getCompanyBookingsPaged(companyId: string, page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }>;
  getAllBookingsPaged(page: number, limit: number, search?: string): Promise<{ bookings: IBooking[]; total: number }>;
  checkSlotAvailability(companyId: string, date: Date, startTime: string): Promise<boolean>;
  cancelBooking(bookingId: string): Promise<boolean>;
  getStats(companyId: string): Promise<{
    totalConsultations: number;
    completedProjects: number;
    statusBreakdown: { status: string; count: number }[];
  }>;
  getBookingsInDateRange(startDate: Date, endDate: Date, status?: string): Promise<IBooking[]>;
  findOneBooking(companyId: string, date: Date, startTime: string): Promise<IBooking | null>;
  getAllBookings(): Promise<IBooking[]>;
  getCompanyBookings(companyId: string): Promise<IBooking[]>;
}
