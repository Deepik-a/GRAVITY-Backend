import { injectable } from "inversify";
import { INotificationRepository } from "@/domain/repositories/INotificationRepository";
import { INotification } from "@/domain/entities/Notification";
import { NotificationModel } from "@/infrastructure/database/models/NotificationModel";

@injectable()
export class NotificationRepository implements INotificationRepository {
  async create(notification: INotification): Promise<INotification> {
    const created = await NotificationModel.create(notification);
    return this._mapToEntity(created.toObject());
  }

  async getNotifications(recipientId: string, recipientType: string, limit = 20): Promise<INotification[]> {
    const notifications = await NotificationModel.find({ recipientId, recipientType })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return notifications.map(n => this._mapToEntity(n));
  }

  async markAsRead(notificationId: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true });
  }

  async markAllAsRead(recipientId: string, recipientType: string): Promise<void> {
    await NotificationModel.updateMany({ recipientId, recipientType, isRead: false }, { isRead: true });
  }

  private _mapToEntity(doc: unknown): INotification {
    const d = doc as {
      _id: { toString(): string };
      recipientId: string;
      recipientType: "user" | "company";
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: Date;
    };
    return {
      id: d._id.toString(),
      recipientId: d.recipientId,
      recipientType: d.recipientType,
      title: d.title,
      message: d.message,
      type: d.type,
      isRead: d.isRead,
      createdAt: d.createdAt
    };
  }
}
