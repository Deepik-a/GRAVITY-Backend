export interface ICreateSubscriptionCheckoutSessionUseCase {
  execute(companyId: string, planId: string, successUrl: string, cancelUrl: string): Promise<string | null>;
}
