export interface IRescheduleBookingUseCase {
  execute(bookingId: string, newDate: Date, newStartTime: string): Promise<void>;
}
