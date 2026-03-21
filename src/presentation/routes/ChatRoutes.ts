import express from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ChatController } from "@/presentation/controllers/ChatController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";
import { ROUTES } from "@/shared/constants/routes";

const router = express.Router();
const chatController = container.get<ChatController>(TYPES.ChatController);
const authMiddleware = container.get<SessionAuth>(TYPES.SessionAuth);

import { upload } from "@/presentation/middlewares/MulterUpload";

// All chat routes require authentication
router.use(authMiddleware.verify.bind(authMiddleware));

router.post(ROUTES.CHAT.ATTACHMENTS.replace("/chat", ""), upload.single("file"), chatController.uploadAttachment.bind(chatController));
router.post(ROUTES.CHAT.SEND_MESSAGE.replace("/chat", ""), chatController.sendMessage.bind(chatController));
router.get(ROUTES.CHAT.MESSAGES.replace("/chat", "") + "/:conversationId", chatController.getMessages.bind(chatController));
router.get(ROUTES.CHAT.CONVERSATIONS.replace("/chat", "") + "/:participantId", chatController.getConversations.bind(chatController));

export default router;
