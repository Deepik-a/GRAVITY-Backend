import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ICreateCheckoutSessionUseCase } from "@/application/interfaces/use-cases/payment/ICreateCheckoutSessionUseCase";
import { ICreateSubscriptionCheckoutSessionUseCase } from "@/application/interfaces/use-cases/payment/ICreateSubscriptionCheckoutSessionUseCase";
import { IStripeWebhookUseCase } from "@/application/interfaces/use-cases/payment/IStripeWebhookUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { AppError } from "@/shared/error/AppError";
import { Messages } from "@/shared/constants/message";

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.CreateCheckoutSessionUseCase) private _createCheckoutSessionUseCase: ICreateCheckoutSessionUseCase,
    @inject(TYPES.CreateSubscriptionCheckoutSessionUseCase) private _createSubscriptionCheckoutSessionUseCase: ICreateSubscriptionCheckoutSessionUseCase,
    @inject(TYPES.StripeWebhookUseCase) private _stripeWebhookUseCase: IStripeWebhookUseCase
  ) {}

  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.body;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      
      const sessionUrl = await this._createCheckoutSessionUseCase.execute(
        bookingId,
        `${frontendUrl}/User/payment-success`,
        `${frontendUrl}/User/payment-failure`
      );

      res.status(StatusCode.SUCCESS).json({ url: sessionUrl });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : Messages.GENERIC.INTERNAL_ERROR;
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async createSubscriptionCheckout(req: Request, res: Response): Promise<void> {
    try {
      const { planId, companyId } = req.body;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

      // Redirect to Company Dashboard after payment
      const sessionUrl = await this._createSubscriptionCheckoutSessionUseCase.execute(
        companyId,
        planId,
        `${frontendUrl}/Company/payment-success`,
        `${frontendUrl}/Company/payment-failure`
      );

      res.status(StatusCode.SUCCESS).json({ url: sessionUrl });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : Messages.GENERIC.INTERNAL_ERROR;
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
      
      const result = await this._stripeWebhookUseCase.execute(req.body, sig, webhookSecret);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error: unknown) {
       const message = error instanceof Error ? error.message : Messages.GENERIC.UNKNOWN_ERROR;
       res.status(StatusCode.BAD_REQUEST).send(`${Messages.GENERIC.WEBHOOK_ERROR}: ${message}`);
    }
  }

  async verifySession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = (req.query.sessionId || req.params.sessionId) as string;
      if (!sessionId) {
        throw new AppError(Messages.GENERIC.SESSION_ID_REQUIRED, StatusCode.BAD_REQUEST);
      }
      const result = await this._stripeWebhookUseCase.verifySession(sessionId as string);
      if (!result.success) {
        res.status(StatusCode.BAD_REQUEST).json(result);
        return;
      }

      res.status(StatusCode.SUCCESS).json(result);

    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : Messages.GENERIC.INTERNAL_ERROR;
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }
}
