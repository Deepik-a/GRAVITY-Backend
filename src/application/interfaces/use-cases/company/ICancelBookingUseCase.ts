export interface ICancelBookingUseCase {
  execute(companyId: string, bookingId: string): Promise<void>;
}
