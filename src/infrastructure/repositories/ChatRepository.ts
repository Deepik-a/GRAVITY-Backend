import CompanyModel from "@/infrastructure/database/models/CompanyModel";
import { MessageModel } from "@/infrastructure/database/models/MessageModel";
import { ConversationModel } from "@/infrastructure/database/models/ConversationModel";
import UserModel from "@/infrastructure/database/models/UserModel";
import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Message } from "@/domain/entities/Message";
import { Conversation } from "@/domain/entities/Conversation";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { IStorageService } from "@/domain/services/IStorageService";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import mongoose from "mongoose";
import { IConversationSchema } from "@/infrastructure/database/models/ConversationModel";
import { IMessageSchema } from "@/infrastructure/database/models/MessageModel";

@injectable()
export class ChatRepository implements IChatRepository {
  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService
  ) {}

  private async _resolveAttachmentUrl(url?: string): Promise<string | undefined> {
    if (!url || url.startsWith("http") || url.startsWith("data:")) return url;
    try {
      return await this._s3Service.getSignedUrl(url);
    } catch {
      return url;
    }
  }

  async saveMessage(message: Message): Promise<Message> {
    const created = await MessageModel.create({
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      attachmentUrl: message.attachmentUrl,
      attachmentKey: message.attachmentKey,
      attachmentType: message.attachmentType,
      status: message.status,
    });

    return new Message({
      id: new UniqueEntityID((created as { _id: mongoose.Types.ObjectId })._id.toString()),
      conversationId: created.conversationId.toString(),
      senderId: created.senderId.toString(),
      senderType: created.senderType as "user" | "company",
      content: created.content,
      attachmentUrl: await this._resolveAttachmentUrl(created.attachmentKey || created.attachmentUrl),
      attachmentKey: created.attachmentKey,
      attachmentType: created.attachmentType as "image" | "file",
      status: created.status as "sent" | "delivered" | "read",
      createdAt: created.createdAt,
    });
  }

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const messages = await MessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return await Promise.all(messages.map(
      async (m: IMessageSchema) =>
        new Message({
          id: new UniqueEntityID((m._id as mongoose.Types.ObjectId).toString()),
          conversationId: m.conversationId.toString(),
          senderId: m.senderId.toString(),
          senderType: m.senderType as "user" | "company",
          content: m.content as string,
          attachmentUrl: await this._resolveAttachmentUrl(m.attachmentKey || m.attachmentUrl),
          attachmentKey: m.attachmentKey as string | undefined,
          attachmentType: m.attachmentType as "image" | "file",
          status: m.status as "sent" | "delivered" | "read",
          createdAt: m.createdAt as Date,
        })
    ));
  }

  async createConversation(participants: { participantId: string; participantType: string }[]): Promise<Conversation> {
    
    // Validate participants
    if (!participants || participants.length !== 2) {
      throw new Error("Conversation must have exactly 2 participants");
    }

    // Validate each participant
    participants.forEach((p, index) => {
      if (!p.participantId) {
        throw new Error(`Participant ${index} is missing participantId`);
      }
      if (!p.participantType) {
        throw new Error(`Participant ${index} (ID: ${p.participantId}) is missing participantType`);
      }
      if (p.participantType !== "user" && p.participantType !== "company") {
        throw new Error(`Participant ${index} has invalid participantType: ${p.participantType}`);
      }
    });

    // Check for duplicate participants
    if (participants[0].participantId === participants[1].participantId) {
      throw new Error(`Cannot create conversation with same participant twice: ${participants[0].participantId}`);
    }

    const created = await ConversationModel.create({
      participants: participants.map((p) => ({
        participantId: new mongoose.Types.ObjectId(p.participantId),
        participantType: p.participantType,
      })),
    });

    return new Conversation({
      id: new UniqueEntityID((created as { _id: mongoose.Types.ObjectId })._id.toString()),
      participants: (created.participants as { participantId: { toString: () => string }; participantType: string }[]).map((p) => ({
        participantId: p.participantId.toString(),
        participantType: p.participantType as "user" | "company",
      })),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async getConversation(participant1Id: string, participant2Id: string): Promise<Conversation | null> {
    const conversation = await ConversationModel.findOne({
      $and: [
        { "participants.participantId": new mongoose.Types.ObjectId(participant1Id) },
        { "participants.participantId": new mongoose.Types.ObjectId(participant2Id) },
      ],
    }).exec();

    if (!conversation) return null;

    return new Conversation({
      id: new UniqueEntityID((conversation as { _id: mongoose.Types.ObjectId })._id.toString()),
      participants: (conversation.participants as { participantId: { toString: () => string }; participantType: string }[]).map((p) => ({
        participantId: p.participantId.toString(),
        participantType: p.participantType as "user" | "company",
      })),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    // keeping this simple, can add log if needed
    const conversation = await ConversationModel.findById(id).exec();
    if (!conversation) return null;

    return new Conversation({
      id: new UniqueEntityID((conversation as { _id: mongoose.Types.ObjectId })._id.toString()),
      participants: (conversation.participants as { participantId: { toString: () => string }; participantType: string }[]).map((p) => ({
        participantId: p.participantId.toString(),
        participantType: p.participantType as "user" | "company",
      })),
      lastMessage: conversation.lastMessage,
      lastMessageAt: conversation.lastMessageAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  }

  async getUserConversations(participantId: string, participantType: string): Promise<Conversation[]> {
    
    const conversations = await ConversationModel.find({
      participants: { $elemMatch: { participantId: new mongoose.Types.ObjectId(participantId), participantType } }
    })
      .sort({ updatedAt: -1 })
      .exec();
    

    return await Promise.all(conversations.map(
      async (c: IConversationSchema) => {
        // Find the other participant - strictly exclude current person by BOTH id and type
        const otherParticipant = (c.participants as { participantId: { toString: () => string }; participantType: string }[]).find(p => 
          p.participantId.toString() !== participantId || p.participantType !== participantType
        );
        let otherParticipantName = "Unknown";
        let otherParticipantImage = undefined;

        if (otherParticipant) {
          if (otherParticipant.participantType === "user") {
            const user = await UserModel.findById(otherParticipant.participantId).select("name profileImage").exec();
            if (user) {
              otherParticipantName = user.name;
              otherParticipantImage = user.profileImage || undefined;
            }
          } else {
            const company = await CompanyModel.findById(otherParticipant.participantId).select("name profileImage profile.brandIdentity.logo").exec();
            if (company) {
              otherParticipantName = company.name;
              otherParticipantImage = (company.profileImage || company.profile?.brandIdentity?.logo) || undefined;
            }
          }
        }

        return new Conversation({
          id: new UniqueEntityID((c._id as mongoose.Types.ObjectId).toString()),
          participants: c.participants.map((p) => ({
            participantId: p.participantId.toString(),
            participantType: p.participantType as "user" | "company",
          })),
          lastMessage: c.lastMessage,
          lastMessageAt: c.lastMessageAt,
          otherParticipantName,
          otherParticipantImage,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        });
      }
    ));
  }

  async updateLastMessage(conversationId: string, message: string, timestamp: Date): Promise<void> {
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessage: message,
        lastMessageAt: timestamp,
      },
    }).exec();
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        status: { $ne: "read" },
      },
      { $set: { status: "read" } }
    ).exec();
  }

  async markMessagesAsDelivered(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        status: "sent",
      },
      { $set: { status: "delivered" } }
    ).exec();
  }
}
