import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { INotificationRepository } from "@/domain/repositories/INotificationRepository";
import { StatusCode } from "@/domain/enums/StatusCode";
import { AuthenticatedUser } from "@/types/auth";

@injectable()
export class NotificationController {
  constructor(
    @inject(TYPES.NotificationRepository) private _notificationRepository: INotificationRepository
  ) {}

  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user?.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      const notifications = await this._notificationRepository.getNotifications(user.id, user.role);
      res.status(StatusCode.SUCCESS).json(notifications);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(StatusCode.INTERNAL_ERROR).json({ message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;
      await this._notificationRepository.markAsRead(notificationId);
      res.status(StatusCode.SUCCESS).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(StatusCode.INTERNAL_ERROR).json({ message });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as AuthenticatedUser;
      if (!user?.id) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }

      await this._notificationRepository.markAllAsRead(user.id, user.role);
      res.status(StatusCode.SUCCESS).json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      res.status(StatusCode.INTERNAL_ERROR).json({ message });
    }
  }
}
