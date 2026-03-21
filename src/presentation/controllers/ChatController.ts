import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISendMessageUseCase } from "@/application/interfaces/use-cases/chat/ISendMessageUseCase";
import { IGetMessagesUseCase } from "@/application/interfaces/use-cases/chat/IGetMessagesUseCase";
import { IGetConversationsUseCase } from "@/application/interfaces/use-cases/chat/IGetConversationsUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { ILogger } from "@/domain/services/ILogger";
import { Messages } from "@/shared/constants/message";

import { IStorageService } from "@/domain/services/IStorageService";

@injectable()
export class ChatController {
  constructor(
    @inject(TYPES.SendMessageUseCase) private _sendMessageUseCase: ISendMessageUseCase,
    @inject(TYPES.GetMessagesUseCase) private _getMessagesUseCase: IGetMessagesUseCase,
    @inject(TYPES.GetConversationsUseCase) private _getConversationsUseCase: IGetConversationsUseCase,
    @inject(TYPES.StorageService) private _s3Service: IStorageService,
    @inject(TYPES.Logger) private _logger: ILogger
  ) {}

  async uploadAttachment(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(StatusCode.BAD_REQUEST).json({ message: Messages.CHAT.MISSING_FIELDS });
      }

      const key = await this._s3Service.uploadFile(file, "chat-attachments");
      const url = await this._s3Service.getSignedUrl(key);

      res.status(StatusCode.SUCCESS).json({
        url,
        key,
        type: file.mimetype.startsWith("image/") ? "image" : "file"
      });
    } catch (error) {
      this._logger.error("UploadAttachment error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: Messages.CHAT.UPLOAD_FAILED });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const message = await this._sendMessageUseCase.execute(req.body);
      res.status(StatusCode.SUCCESS).json(message);
    } catch (error) {
      this._logger.error("SendMessage error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: Messages.GENERIC.SERVER_ERROR });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { conversationId } = req.params;
      const messages = await this._getMessagesUseCase.execute(conversationId);
      res.status(StatusCode.SUCCESS).json(messages);
    } catch (error) {
      this._logger.error("GetMessages error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: Messages.GENERIC.SERVER_ERROR });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const { participantId } = req.params;
      const { type } = req.query; // Expect type in query string or headers
      const conversations = await this._getConversationsUseCase.execute(participantId, type as string || "user");
      res.status(StatusCode.SUCCESS).json(conversations);
    } catch (error) {
      this._logger.error("GetConversations error:", { error });
      res.status(StatusCode.INTERNAL_ERROR).json({ message: Messages.GENERIC.SERVER_ERROR });
    }
  }
}
