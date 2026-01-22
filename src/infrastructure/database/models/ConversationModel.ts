import mongoose, { Schema, Document } from "mongoose";

export interface IConversationSchema extends Document {
  participants: {
    participantId: mongoose.Types.ObjectId;
    participantType: "user" | "company";
  }[];
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    participants: [
      {
        participantId: { type: Schema.Types.ObjectId, required: true },
        participantType: { type: String, enum: ["user", "company"], required: true },
      },
    ],
    lastMessage: { type: String },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Index for quick lookup of conversations between two specific participants
ConversationSchema.index({ "participants.participantId": 1 });

export const ConversationModel = mongoose.model<IConversationSchema>("Conversation", ConversationSchema);
