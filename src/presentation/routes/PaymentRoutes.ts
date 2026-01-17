import express, { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { PaymentController } from "@/presentation/controllers/userController/PaymentController";
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware";

const router = Router();
const paymentController = container.get<PaymentController>(TYPES.PaymentController);
const userAuth = container.get<SessionAuth>(TYPES.SessionAuth);

// Create checkout session - needs auth
router.post(
  "/create-checkout-session",
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
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook.bind(paymentController)
);
 
// Verify session - needs auth
router.get(
  "/verify-session",
  userAuth.verify,
  paymentController.verifySession.bind(paymentController)
);
 
export default router;
