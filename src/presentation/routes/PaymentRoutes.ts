import express, { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { PaymentController } from "@/presentation/controllers/userController/PaymentController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";
import { ROUTES } from "@/shared/constants/routes";

const router = Router();
const paymentController = container.get<PaymentController>(TYPES.PaymentController);
const userAuth = container.get<SessionAuth>(TYPES.SessionAuth);

// Create checkout session - needs auth
router.post(
  ROUTES.PAYMENTS.CREATE_CHECKOUT.replace("/payments", ""),
  userAuth.verify,
  userAuth.authorize(["user"]),
  paymentController.createCheckoutSession.bind(paymentController)
);

// Create subscription checkout - Auth Company
router.post(
  "/create-subscription-checkout",
  userAuth.verify,
  userAuth.authorize(["company"]),
  paymentController.createSubscriptionCheckout.bind(paymentController)
);

// Webhook - NO auth, needs raw body
router.post(
  ROUTES.PAYMENTS.WEBHOOK.replace("/payments", ""),
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook.bind(paymentController)
);
 
// Verify session - NO auth needed as we verify sessionId with Stripe
router.get(
  ROUTES.PAYMENTS.VERIFY_SESSION.replace("/payments", ""),
  paymentController.verifySession.bind(paymentController)
);
 
export default router;
