import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Message } from "@/domain/entities/Message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetMessagesUseCase } from "@/application/interfaces/use-cases/chat/IGetMessagesUseCase";

@injectable()
export class GetMessagesUseCase implements IGetMessagesUseCase {
  constructor(
    @inject(TYPES.ChatRepository) private _chatRepository: IChatRepository
  ) {}

  async execute(conversationId: string): Promise<Message[]> {
    return await this._chatRepository.getMessages(conversationId);
  }
}
