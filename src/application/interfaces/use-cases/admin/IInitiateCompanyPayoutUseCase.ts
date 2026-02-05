export interface IInitiateCompanyPayoutUseCase {
  execute(bookingId: string): Promise<boolean>;
}
