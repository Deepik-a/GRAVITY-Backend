import { IBooking } from "@/domain/entities/Booking";

export interface IBookSlotUseCase {
  execute(bookingData: IBooking): Promise<IBooking>;
}
