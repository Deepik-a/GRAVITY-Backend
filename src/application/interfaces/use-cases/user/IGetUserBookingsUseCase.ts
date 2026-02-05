import { IBooking } from "@/domain/entities/Booking";

export interface IGetUserBookingsUseCase {
  execute(userId: string): Promise<IBooking[]>;
}
