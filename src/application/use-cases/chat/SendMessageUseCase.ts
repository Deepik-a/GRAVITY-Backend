import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { Message } from "@/domain/entities/Message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";



import { ISendMessageUseCase, SendMessageDTO } from "@/application/interfaces/use-cases/chat/ISendMessageUseCase";

@injectable()
export class SendMessageUseCase implements ISendMessageUseCase {
  constructor(
    @inject(TYPES.ChatRepository) private _chatRepository: IChatRepository
  ) {}

  async execute(data: SendMessageDTO): Promise<Message> {
    // Validation: Ensure sender and receiver are different
    if (data.senderId === data.receiverId) {
      throw new Error("Cannot send message to yourself");
    }

    // Validation: Ensure participantType is provided
    if (!data.senderType) {
      throw new Error("Sender participantType is required");
    }
    if (!data.receiverType) {
      throw new Error("Receiver participantType is required");
    }

    // Validation: Ensure valid participantType values
    if (data.senderType !== "user" && data.senderType !== "company") {
      throw new Error("Invalid sender participantType. Must be 'user' or 'company'");
    }
    if (data.receiverType !== "user" && data.receiverType !== "company") {
      throw new Error("Invalid receiver participantType. Must be 'user' or 'company'");
    }

    // 1. Get or create conversation
    let conversation = await this._chatRepository.getConversation(data.senderId, data.receiverId);

    if (!conversation) {
      conversation = await this._chatRepository.createConversation([
        { participantId: data.senderId, participantType: data.senderType },
        { participantId: data.receiverId, participantType: data.receiverType },
      ]);
    }

    // 2. Save message
    const message = new Message({
      conversationId: conversation.id.toString(),
      senderId: data.senderId,
      senderType: data.senderType,
      content: data.content,
    });

    const savedMessage = await this._chatRepository.saveMessage(message);

    // 3. Update conversation last message
    await this._chatRepository.updateLastMessage(
      conversation.id.toString(),
      data.content,
      savedMessage.createdAt
    );

    return savedMessage;
  }
}
