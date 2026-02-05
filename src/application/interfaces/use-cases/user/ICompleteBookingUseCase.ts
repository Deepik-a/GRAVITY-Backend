export interface ICompleteBookingUseCase {
  execute(bookingId: string, userId: string): Promise<{
    success: boolean;
    message: string;
    settlementAmount: number;
    platformFee: number;
  }>;
}
