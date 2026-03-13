import Stripe from "stripe";

export interface IStripeService {
  createCheckoutSession(params: {
    amount: number;
    bookingId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail: string;
    companyName: string;
  }): Promise<Stripe.Checkout.Session>;

  createSubscriptionCheckoutSession(params: {
    amount: number;
    planId: string;
    companyId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail: string;
    planName: string;
  }): Promise<Stripe.Checkout.Session>;

  verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string): Stripe.Event;

  retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session>;
}
