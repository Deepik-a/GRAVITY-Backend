import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { StripeService } from "@/infrastructure/services/StripeService";
import { Stripe } from "stripe";

@injectable()
export class StripeWebhookUseCase {
  constructor(
    @inject(TYPES.StripeService) private _stripeService: StripeService,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.SubscriptionRepository) private _subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(payload: string | Buffer, signature: string, secret: string) {
    let event: Stripe.Event;

    try {
      event = await this._stripeService.verifyWebhookSignature(payload, signature, secret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`Webhook Error: ${message}`);
    }

    console.log(`[StripeWebhook] Received event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      if (type === "booking") {
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await this._bookingRepository.updateById(bookingId, {
            paymentStatus: "paid",
            status: "confirmed",
          });
        }
      } else if (type === "subscription") {
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        if (companyId && planId) {
          await this.handleSubscriptionSuccess(companyId, planId, session);
        }
      }

    } else if (event.type === "checkout.session.async_payment_failed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === "booking") {
             const bookingId = session.metadata.bookingId;
             if (bookingId) {
                  await this._bookingRepository.updateById(bookingId, {
                    paymentStatus: "failed",
                  });
             }
        }
    }

    return { received: true };
  }

  async verifySession(sessionId: string) {
    console.log(`[StripeWebhook] Verifying session: ${sessionId}`);
    const session = await this._stripeService.retrieveSession(sessionId);
    
    if (session.payment_status === 'paid') {
       const type = session.metadata?.type;
       if (type === 'subscription') {
         const companyId = session.metadata?.companyId;
         const planId = session.metadata?.planId;
         if (companyId && planId) {
            await this.handleSubscriptionSuccess(companyId, planId, session);
            return { success: true, message: "Subscription activated" };
         }
       } else if (type === 'booking') {
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
              await this._bookingRepository.updateById(bookingId, {
                paymentStatus: "paid",
                status: "confirmed",
              });
              return { success: true, message: "Booking confirmed" };
          }
       }
    }
    return { success: false, message: "Payment not completed or session not found" };
  }

  private async handleSubscriptionSuccess(companyId: string, planId: string, session: Stripe.Checkout.Session) {
    console.log(`[StripeWebhook] Handling success for company: ${companyId}, plan: ${planId}`);
    const plan = await this._subscriptionRepository.getPlanById(planId);
    if (!plan) {
      // In a real app, use a logger service here
      // console.error(`Plan not found for subscription payment: ${planId}`); 
      return;
    }

    const startDate = new Date();
    const endDate = new Date(startDate);

    if (plan.duration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.duration === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    await this._companyRepository.updateSubscription(companyId, {
      planId: plan._id,
      status: "active",
      startDate,
      endDate,
      isSubscribed: true,
      stripeSubscriptionId: session.payment_intent as string, // Since mode=payment, we store payment ID
      stripeCustomerId: session.customer as string,
    });
  }
}
