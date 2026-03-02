import { Conversation } from "@/domain/entities/Conversation";
import { Message } from "@/domain/entities/Message";

export interface IChatRepository {
  saveMessage(message: Message): Promise<Message>;
  getMessages(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
  createConversation(participants: { participantId: string; participantType: string }[]): Promise<Conversation>;
  getConversation(participant1Id: string, participant2Id: string): Promise<Conversation | null>;
  getConversationById(id: string): Promise<Conversation | null>;
  getUserConversations(participantId: string, participantType: string): Promise<Conversation[]>;
  updateLastMessage(conversationId: string, message: string, timestamp: Date): Promise<void>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  markMessagesAsDelivered(conversationId: string, userId: string): Promise<void>;
}
