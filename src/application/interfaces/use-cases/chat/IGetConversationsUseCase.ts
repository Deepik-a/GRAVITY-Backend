import { Conversation } from "@/domain/entities/Conversation";

export interface IGetConversationsUseCase {
  execute(participantId: string, participantType: string): Promise<Conversation[]>;
}
