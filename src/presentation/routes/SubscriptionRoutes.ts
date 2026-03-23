
import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { SubscriptionController } from "@/presentation/controllers/SubscriptionController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";
import { ROUTES } from "@/shared/constants/routes";

const router = Router();

const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);
const sessionAuth = container.get<SessionAuth>(TYPES.SessionAuth);

// Admin Routes
router.post(
  ROUTES.SUBSCRIPTIONS.ADMIN_PLANS.replace("/subscriptions", ""),
  sessionAuth.verify,
  sessionAuth.authorize(["admin"]),
  subscriptionController.createPlan.bind(subscriptionController)
);

router.get(
  ROUTES.SUBSCRIPTIONS.PLANS.replace("/subscriptions", ""),
  subscriptionController.getPlans.bind(subscriptionController)
);

export default router;
