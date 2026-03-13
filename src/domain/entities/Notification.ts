export interface INotification {
  id?: string;
  recipientId: string;
  recipientType: "user" | "company";
  title: string;
  message: string;
  type: string; // e.g., "BOOKING_CONFIRMED", "NEW_BOOKING", etc.
  isRead: boolean;
  createdAt?: Date;
}
