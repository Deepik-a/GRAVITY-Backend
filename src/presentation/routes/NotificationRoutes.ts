import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { NotificationController } from "@/presentation/controllers/NotificationController";
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware";

const router = Router();
const notificationController = container.get<NotificationController>(TYPES.NotificationController);
const auth = container.get<SessionAuth>(TYPES.SessionAuth);

router.get(
  "/",
  auth.verify,
  auth.authorize(["user", "company"]),
  notificationController.getNotifications.bind(notificationController)
);

router.patch(
  "/:notificationId/read",
  auth.verify,
  auth.authorize(["user", "company"]),
  notificationController.markAsRead.bind(notificationController)
);

router.patch(
  "/read-all",
  auth.verify,
  auth.authorize(["user", "company"]),
  notificationController.markAllAsRead.bind(notificationController)
);

export default router;
