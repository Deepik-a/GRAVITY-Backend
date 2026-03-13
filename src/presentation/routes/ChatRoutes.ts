import express from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ChatController } from "@/presentation/controllers/ChatController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";

const router = express.Router();
const chatController = container.get<ChatController>(TYPES.ChatController);
const authMiddleware = container.get<SessionAuth>(TYPES.SessionAuth);

// All chat routes require authentication
router.use(authMiddleware.verify.bind(authMiddleware));

router.post("/send", chatController.sendMessage.bind(chatController));
router.get("/messages/:conversationId", chatController.getMessages.bind(chatController));
router.get("/conversations/:participantId", chatController.getConversations.bind(chatController));

export default router;
