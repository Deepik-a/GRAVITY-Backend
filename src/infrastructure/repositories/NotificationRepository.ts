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

  private _mapToEntity(doc: any): INotification {
    return {
      id: doc._id.toString(),
      recipientId: doc.recipientId,
      recipientType: doc.recipientType,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      isRead: doc.isRead,
      createdAt: doc.createdAt
    };
  }
}
