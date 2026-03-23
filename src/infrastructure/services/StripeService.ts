import Stripe from "stripe";
import { injectable } from "inversify";

@injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      // @ts-expect-error: Suppressing stripe api version mismatch
      apiVersion: "2025-01-27.acacia",
    });
  }

  async createCheckoutSession(params: {
    amount: number;
    bookingId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail: string;
    companyName: string;
  }) {
    // 10% commission to admin
    const totalAmount = params.amount * 100; // Stripe expects amount in cents
    
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Slot Booking - ${params.companyName}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: {
        type: "booking",
        bookingId: params.bookingId,
      },
    } as Stripe.Checkout.SessionCreateParams);
  }

  async createSubscriptionCheckoutSession(params: {
    amount: number;
    planId: string;
    companyId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail: string;
    planName: string;
  }) {
    const totalAmount = params.amount * 100; // cents

    return await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Subscription Plan: ${params.planName}`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail,
      metadata: {
        type: "subscription",
        planId: params.planId,
        companyId: params.companyId,
      },
    } as Stripe.Checkout.SessionCreateParams);
  }

  async verifyWebhookSignature(payload: string | Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async retrieveSession(sessionId: string) {
    return await this.stripe.checkout.sessions.retrieve(sessionId);
  }
}
