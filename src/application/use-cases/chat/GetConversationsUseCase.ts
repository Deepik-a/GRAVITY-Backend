import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Conversation } from "@/domain/entities/Conversation";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetConversationsUseCase } from "@/application/interfaces/use-cases/chat/IGetConversationsUseCase";

@injectable()
export class GetConversationsUseCase implements IGetConversationsUseCase {
  constructor(
    @inject(TYPES.ChatRepository) private _chatRepository: IChatRepository
  ) {}

  async execute(participantId: string): Promise<Conversation[]> {
    return await this._chatRepository.getUserConversations(participantId);
  }
}
