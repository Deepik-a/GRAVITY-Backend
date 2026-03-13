import { IBooking } from "@/domain/entities/Booking";

export interface IGetAllBookingsUseCase {
  execute(): Promise<IBooking[]>;
}
