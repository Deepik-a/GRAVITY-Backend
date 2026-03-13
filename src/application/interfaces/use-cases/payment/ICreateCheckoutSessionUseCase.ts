export interface ICreateCheckoutSessionUseCase {
  execute(bookingId: string, successUrl: string, cancelUrl: string): Promise<string | null>;
}
