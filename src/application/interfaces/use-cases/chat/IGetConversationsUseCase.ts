import { Conversation } from "@/domain/entities/Conversation";

export interface IGetConversationsUseCase {
  execute(participantId: string): Promise<Conversation[]>;
}
