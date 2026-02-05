import { Message } from "@/domain/entities/Message";

export interface SendMessageDTO {
  senderId: string;
  senderType: "user" | "company";
  receiverId: string;
  receiverType: "user" | "company";
  content: string;
}

export interface ISendMessageUseCase {
  execute(data: SendMessageDTO): Promise<Message>;
}
