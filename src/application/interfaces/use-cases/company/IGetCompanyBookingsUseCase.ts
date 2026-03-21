import { IBooking } from "@/domain/entities/Booking";

export interface IGetCompanyBookingsUseCase {
  execute(companyId: string, page?: number, limit?: number): Promise<{ bookings: IBooking[]; total: number }>;
}
