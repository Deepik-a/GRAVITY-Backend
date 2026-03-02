import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Message } from "@/domain/entities/Message";
import { Conversation } from "@/domain/entities/Conversation";
import { MessageModel } from "@/infrastructure/database/models/MessageModel";
import { ConversationModel } from "@/infrastructure/database/models/ConversationModel";
import UserModel from "@/infrastructure/database/models/UserModel";
import CompanyModel from "@/infrastructure/database/models/CompanyModel";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { injectable } from "inversify";
import mongoose from "mongoose";

@injectable()
export class ChatRepository implements IChatRepository {
  async saveMessage(message: Message): Promise<Message> {
    console.log("ChatRepo: Saving message", { senderId: message.senderId, receiverId: message.conversationId }); // conversationId is not receiverId but context
    const created = await MessageModel.create({
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      status: message.status,
    });
    console.log("ChatRepo: Message saved", created._id);

    return new Message({
      id: new UniqueEntityID((created as { _id: mongoose.Types.ObjectId })._id.toString()),
      conversationId: created.conversationId.toString(),
      senderId: created.senderId.toString(),
      senderType: created.senderType as "user" | "company",
      content: created.content,
      status: created.status as "sent" | "delivered" | "read",
      createdAt: created.createdAt,
    });
  }

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    console.log(`ChatRepo: getMessages for ${conversationId}`);
    const messages = await MessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .exec();
    console.log(`ChatRepo: Found ${messages.length} messages`);

    return messages.map(
      (m) =>
        new Message({
          id: new UniqueEntityID((m as { _id: mongoose.Types.ObjectId })._id.toString()),
          conversationId: m.conversationId.toString(),
          senderId: m.senderId.toString(),
          senderType: m.senderType as "user" | "company",
          content: m.content,
          status: m.status as "sent" | "delivered" | "read",
          createdAt: m.createdAt,
        })
    );
  }

  async createConversation(participants: { participantId: string; participantType: string }[]): Promise<Conversation> {
    console.log("ChatRepo: Creating conversation for", participants);
    
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
    console.log("ChatRepo: Conversation created", created._id);

    return new Conversation({
      id: new UniqueEntityID((created as { _id: mongoose.Types.ObjectId })._id.toString()),
      participants: created.participants.map((p) => ({
        participantId: p.participantId.toString(),
        participantType: p.participantType as "user" | "company",
      })),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async getConversation(participant1Id: string, participant2Id: string): Promise<Conversation | null> {
    console.log(`ChatRepo: getConversation between ${participant1Id} and ${participant2Id}`);
    const conversation = await ConversationModel.findOne({
      $and: [
        { "participants.participantId": new mongoose.Types.ObjectId(participant1Id) },
        { "participants.participantId": new mongoose.Types.ObjectId(participant2Id) },
      ],
    }).exec();

    if (!conversation) {
        console.log("ChatRepo: No conversation found between participants");
        return null;
    }
    console.log("ChatRepo: Conversation found", conversation._id);

    return new Conversation({
      id: new UniqueEntityID((conversation as { _id: mongoose.Types.ObjectId })._id.toString()),
      participants: conversation.participants.map((p) => ({
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
      participants: conversation.participants.map((p) => ({
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
    console.log(`ChatRepo: getUserConversations for participantId=${participantId}, type=${participantType}`);
    
    const conversations = await ConversationModel.find({
      participants: { $elemMatch: { participantId: new mongoose.Types.ObjectId(participantId), participantType } }
    })
      .sort({ updatedAt: -1 })
      .exec();
    
    console.log(`ChatRepo: Found ${conversations.length} raw conversations for ${participantType}:${participantId}`);

    return await Promise.all(conversations.map(
      async (c) => {
        // Find the other participant - strictly exclude current person by BOTH id and type
        const otherParticipant = c.participants.find(p => 
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
          id: new UniqueEntityID((c as { _id: mongoose.Types.ObjectId })._id.toString()),
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
