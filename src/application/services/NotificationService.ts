import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { INotificationRepository } from "@/domain/repositories/INotificationRepository";
import { INotification } from "@/domain/entities/Notification";
import { SocketManager } from "@/infrastructure/sockets/SocketManager";

@injectable()
export class NotificationService {
  constructor(
    @inject(TYPES.NotificationRepository) private _notificationRepository: INotificationRepository
  ) {}

  async createNotification(notificationData: Omit<INotification, "isRead">): Promise<INotification> {
    const notification: INotification = {
      ...notificationData,
      isRead: false,
    };

    const savedNotification = await this._notificationRepository.create(notification);
    
    // Emit notification via socket
    SocketManager.sendNotification(savedNotification.recipientId, savedNotification.recipientType, savedNotification);

    return savedNotification;
  }
}
