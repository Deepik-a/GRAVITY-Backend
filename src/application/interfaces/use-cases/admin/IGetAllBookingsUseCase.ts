import { IBooking } from "@/domain/entities/Booking";

export interface IGetAllBookingsUseCase {
  execute(page?: number, limit?: number): Promise<{ bookings: IBooking[]; total: number }>;
}
