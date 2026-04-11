import { IBooking } from "@/domain/entities/Booking";

export interface IGetAllBookingsUseCase {
  execute(page?: number, limit?: number, search?: string): Promise<{ bookings: IBooking[]; total: number }>;
}
