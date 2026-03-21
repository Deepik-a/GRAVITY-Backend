import { IBooking } from "@/domain/entities/Booking";

export interface IGetUserBookingsUseCase {
  execute(userId: string, page?: number, limit?: number): Promise<{ bookings: IBooking[]; total: number }>;
}
