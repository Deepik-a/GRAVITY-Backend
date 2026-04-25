import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { NotificationService } from "@/application/services/NotificationService";

import { Stripe } from "stripe";

import { IStripeWebhookUseCase } from "@/application/interfaces/use-cases/payment/IStripeWebhookUseCase";
import { IStripeService } from "@/domain/services/IStripeService";
import { Messages } from "@/shared/constants/message";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

@injectable()
export class StripeWebhookUseCase implements IStripeWebhookUseCase {
  constructor(
    @inject(TYPES.StripeService) private _stripeService: IStripeService,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.SubscriptionRepository) private _subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(payload: string | Buffer, signature: string, secret: string) {
    let event: Stripe.Event;

    try {
      event = await this._stripeService.verifyWebhookSignature(payload, signature, secret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      throw new Error(`${Messages.GENERIC.WEBHOOK_ERROR}: ${message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const type = session.metadata?.type;

      if (type === "booking") {
        const bookingId = session.metadata?.bookingId;
        if (bookingId) {
          await this.processBookingPayment(bookingId, session);
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
                    paymentStatus: PaymentStatus.FAILED,
                  });
             }
        }
    }

    return { received: true };
  }

  async verifySession(sessionId: string) {
    const session = await this._stripeService.retrieveSession(sessionId);
    
    if (session.payment_status === "paid") {
       const type = session.metadata?.type;
       if (type === "subscription") {
         const companyId = session.metadata?.companyId;
         const planId = session.metadata?.planId;
         if (companyId && planId) {
            await this.handleSubscriptionSuccess(companyId, planId, session);
            return { success: true, message: Messages.GENERIC.SUBSCRIPTION_ACTIVATED };
         }
       } else if (type === "booking") {
          const bookingId = session.metadata?.bookingId;
          if (bookingId) {
              const booking = await this._bookingRepository.findById(bookingId);
              if (booking?.status === "cancelled" && booking.paymentStatus === PaymentStatus.PAID) {
                return { success: false, message: Messages.BOOKING.BOOKING_CANCELLED_REFUND };
              }

              const result = await this.processBookingPayment(bookingId, session);
              if (!result) {
                // If result is false, it means it was either already paid or there was a slot conflict
                const finalBooking = await this._bookingRepository.findById(bookingId);
                if (finalBooking?.status === "cancelled") {
                  return { success: false, message: Messages.BOOKING.SLOT_CONFLICT };
                }
                return { success: true, message: Messages.BOOKING.BOOKING_ALREADY_CONFIRMED, bookingId, sessionId: session.id, booking: finalBooking };
              }
              const finalBooking = await this._bookingRepository.findById(bookingId);
              return { success: true, message: Messages.BOOKING.CONFIRMED_SUCCESS, bookingId, sessionId: session.id, booking: finalBooking };
          }
       }

    }
    return { success: false, message: Messages.GENERIC.PAYMENT_NOT_COMPLETED };
  }

  private async processBookingPayment(bookingId: string, session: Stripe.Checkout.Session): Promise<boolean> {
    const booking = await this._bookingRepository.findById(bookingId);
    
    if (!booking) {
      return false;
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      return false;
    }

    // DOUBLE CHECK: Ensure the slot hasn't been taken by someone else while this user was paying
    const isSlotStillAvailable = await this._bookingRepository.checkSlotAvailability(booking.companyId, booking.date, booking.startTime);
    if (!isSlotStillAvailable) {
      await this._bookingRepository.updateById(bookingId, {
        paymentStatus: PaymentStatus.PAID, // They paid, but slot is gone
        status: "cancelled",   // Slot conflict
      });
      // In a real app, you would initiate a refund here.
      return false;
    }

    // Get company to check subscription status
    const company = await this._companyRepository.findCompanyById(booking.companyId);
    const isSubscribed = company?.isSubscribed || false;
    
    // Calculate commission: 10% if not subscribed, 5% if subscribed
    const commissionRate = isSubscribed ? 5 : 10;
    const commissionAmount = (booking.price || 0) * (commissionRate / 100);
    const netAmount = (booking.price || 0) - commissionAmount;


    // Update booking - ensure it's confirmed AND paid
    await this._bookingRepository.updateById(bookingId, {
      paymentStatus: PaymentStatus.PAID,
      status: "confirmed",
      adminCommission: commissionAmount,
    });

    // Create booking payment transaction
    await this._transactionRepository.createTransaction({
      type: "booking_payment",
      amount: booking.price || 0,
      status: "completed",
      bookingId: bookingId,
      userId: booking.userId,
      companyId: booking.companyId,
      description: `Booking payment for ${booking.date}`,
      commissionRate,
      commissionAmount,
      netAmount,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
    });

    // Create admin commission transaction
    await this._transactionRepository.createTransaction({
      type: "admin_commission",
      amount: commissionAmount,
      status: "completed",
      bookingId: bookingId,
      companyId: booking.companyId,
      description: `Admin commission (${commissionRate}%) from booking`,
      commissionRate,
      commissionAmount,
    });

    // Create company payout transaction (pending_transfer status as per recent transaction updates)
    await this._transactionRepository.createTransaction({
      type: "company_payout",
      amount: netAmount,
      status: "pending_transfer",
      bookingId: bookingId,
      companyId: booking.companyId,
      description: "Payout to company for booking",
      netAmount,
    });

    // Notify User
    await this._notificationService.createNotification({
      recipientId: booking.userId,
      recipientType: "user",
      title: "Payment Successful",
      message: `Your payment for booking on ${new Date(booking.date).toLocaleDateString()} was successful.`,
      type: "PAYMENT_SUCCESS",
    });

    // Notify Company
    await this._notificationService.createNotification({
      recipientId: booking.companyId,
      recipientType: "company",
      title: "New Confirmed Booking",
      message: `A new booking for ${new Date(booking.date).toLocaleDateString()} has been confirmed and paid.`,
      type: "NEW_BOOKING",
    });

    return true;
  }

  private async handleSubscriptionSuccess(companyId: string, planId: string, session: Stripe.Checkout.Session) {
    // Check if company already has this subscription active to prevent double-processing
    const company = await this._companyRepository.findCompanyById(companyId);
    if (company?.subscription?.stripeSubscriptionId === session.payment_intent) {
        return;
    }

    const plan = await this._subscriptionRepository.getPlanById(planId);
    if (!plan) {
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
      stripeSubscriptionId: session.payment_intent as string, 
      stripeCustomerId: session.customer as string,
    });

    // Create subscription payment transaction
    await this._transactionRepository.createTransaction({
      type: "subscription_payment",
      amount: plan.price,
      status: "completed",
      subscriptionPlanId: plan._id,
      companyId: companyId,
      description: "Subscription payment for " + plan.name + " (" + plan.duration + ")",
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
    });

    // Notify Company
    await this._notificationService.createNotification({
      recipientId: companyId,
      recipientType: "company",
      title: "Subscription Active",
      message: `Your ${plan.name} subscription is now active until ${endDate.toLocaleDateString()}.`,
      type: "SUBSCRIPTION_SUCCESS",
    });
  }
}
