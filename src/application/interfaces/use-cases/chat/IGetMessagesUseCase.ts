import { Message } from "@/domain/entities/Message";

export interface IGetMessagesUseCase {
  execute(conversationId: string): Promise<Message[]>;
}
