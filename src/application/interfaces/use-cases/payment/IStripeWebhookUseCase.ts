export interface IStripeWebhookUseCase {
  execute(payload: string | Buffer, signature: string, secret: string): Promise<{ received: boolean }>;
  verifySession(sessionId: string): Promise<{ success: boolean; message: string }>;
}
