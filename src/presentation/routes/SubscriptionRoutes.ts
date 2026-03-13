
import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { SubscriptionController } from "@/presentation/controllers/SubscriptionController";
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware";

const router = Router();

const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);
const sessionAuth = container.get<SessionAuth>(TYPES.SessionAuth);

// Admin Routes
router.post(
  "/admin/plans",
  sessionAuth.verify,
  sessionAuth.authorize(["admin"]),
  subscriptionController.createPlan.bind(subscriptionController)
);

// Public/Company Routes
router.get(
  "/plans",
  subscriptionController.getPlans.bind(subscriptionController)
);

export default router;
