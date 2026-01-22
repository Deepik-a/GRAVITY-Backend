import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Conversation } from "@/domain/entities/Conversation";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class GetConversationsUseCase {
  constructor(
    @inject(TYPES.ChatRepository) private _chatRepository: IChatRepository
  ) {}

  async execute(participantId: string): Promise<Conversation[]> {
    return await this._chatRepository.getUserConversations(participantId);
  }
}
