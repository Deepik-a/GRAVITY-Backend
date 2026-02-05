import { IBooking } from "@/domain/entities/Booking";

export interface IGetCompanyBookingsUseCase {
  execute(companyId: string): Promise<IBooking[]>;
}
