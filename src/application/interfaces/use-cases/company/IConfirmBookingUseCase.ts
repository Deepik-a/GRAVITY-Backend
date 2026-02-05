import { IBooking } from "@/domain/entities/Booking";

export interface IConfirmBookingUseCase {
  execute(bookingId: string): Promise<IBooking>;
}
