import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { SendMessageUseCase } from "@/application/use-cases/chat/SendMessageUseCase";
import { GetMessagesUseCase } from "@/application/use-cases/chat/GetMessagesUseCase";
import { GetConversationsUseCase } from "@/application/use-cases/chat/GetConversationsUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.SendMessageUseCase) private _sendMessageUseCase: SendMessageUseCase,
    @inject(TYPES.GetMessagesUseCase) private _getMessagesUseCase: GetMessagesUseCase,
    @inject(TYPES.GetConversationsUseCase) private _getConversationsUseCase: GetConversationsUseCase,
    @inject(TYPES.Logger) private _logger: ILogger
  ) {}

  async sendMessage(req: Request, res: Response) {
    try {
      const message = await this._sendMessageUseCase.execute(req.body);
      res.status(StatusCode.SUCCESS).json(message);
    } catch (error) {
      this._logger.error("SendMessage error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: "Internal server error" });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const messages = await this._getMessagesUseCase.execute(conversationId);
      res.status(StatusCode.SUCCESS).json(messages);
    } catch (error) {
      this._logger.error("GetMessages error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: "Internal server error" });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const { participantId } = req.params;
      const conversations = await this._getConversationsUseCase.execute(participantId);
      res.status(StatusCode.SUCCESS).json(conversations);
    } catch (error) {
      this._logger.error("GetConversations error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: "Internal server error" });
    }
  }
}
