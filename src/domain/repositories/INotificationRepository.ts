import { INotification } from "@/domain/entities/Notification";

export interface INotificationRepository {
  create(notification: INotification): Promise<INotification>;
  getNotifications(recipientId: string, recipientType: string, limit?: number): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(recipientId: string, recipientType: string): Promise<void>;
}
