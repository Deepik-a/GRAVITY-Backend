import mongoose, { Schema, Document } from "mongoose";
import { INotification } from "@/domain/entities/Notification";

export interface INotificationDocument extends Omit<INotification, "id">, Document {}

const NotificationSchema: Schema = new Schema(
  {
    recipientId: { type: String, required: true },
    recipientType: { type: String, enum: ["user", "company"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<INotificationDocument>("Notification", NotificationSchema);
