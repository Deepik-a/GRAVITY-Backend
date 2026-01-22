import mongoose, { Schema, Document } from "mongoose";

export interface IMessageSchema extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: "user" | "company";
  content: string;
  status: "sent" | "delivered" | "read";
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ["user", "company"], required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  },
  { timestamps: true }
);

export const MessageModel = mongoose.model<IMessageSchema>("Message", MessageSchema);
