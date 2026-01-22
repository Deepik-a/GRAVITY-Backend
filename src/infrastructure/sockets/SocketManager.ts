import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { SendMessageUseCase } from "@/application/use-cases/chat/SendMessageUseCase";
import { ILogger } from "@/domain/services/ILogger";
import { IChatRepository } from "@/domain/repositories/IChatRepository";

interface SendMessageData {
  senderId: string;
  senderType: "user" | "company";
  receiverId: string;
  receiverType: "user" | "company";
  content: string;
}

export class SocketManager {
  private static io: SocketIOServer;
  private logger: ILogger;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private companySockets: Map<string, string> = new Map(); // companyId -> socketId

  constructor(server: HttpServer) {
    this.logger = container.get<ILogger>(TYPES.Logger);
    SocketManager.io = new SocketIOServer<object, object, object, object>(server, {
      cors: {
        origin: "http://localhost:3000",
        credentials: true,
      },
    });

    this.init();
  }

  private init() {
    this.logger.info("Initializing Socket.io");

    SocketManager.io.on("connection", (socket: Socket) => {
      this.logger.info(`New client connected: ${socket.id}`);

      socket.on("join", async (data: { userId: string, type: 'user' | 'company' } | string) => {
        let userId: string;
        let type: 'user' | 'company' = 'user';

        if (typeof data === 'string') {
            userId = data;
        } else {
            userId = data.userId;
            type = data.type;
        }

        this.logger.info(`${type === 'company' ? 'Company' : 'User'} ${userId} joined with socket ${socket.id}`);
        
        if (type === 'company') {
            this.companySockets.set(userId, socket.id);
        } else {
            this.userSockets.set(userId, socket.id);
        }
        
        socket.join(userId);
        
        // Broadcast online status
        socket.broadcast.emit("user_status", { userId, status: "online", type });
        
        // Send list of online users/companies?
        // For now, adhere to existing flow but maybe filter
        const onlineUsers = Array.from(this.userSockets.keys());
        socket.emit("online_users", onlineUsers);
      });

      socket.on("typing", (data: { senderId: string, receiverId: string }) => {
        SocketManager.io.to(data.receiverId).emit("typing", { userId: data.senderId });
      });

      socket.on("stop_typing", (data: { senderId: string, receiverId: string }) => {
        SocketManager.io.to(data.receiverId).emit("stop_typing", { userId: data.senderId });
      });

      socket.on("mark_read", async (data: { conversationId: string, userId: string, otherUserId: string }) => {
        try {
            const chatRepository = container.get<IChatRepository>(TYPES.ChatRepository);
            await chatRepository.markMessagesAsRead(data.conversationId, data.userId);
            
            // Notify the sender that messages were read
            SocketManager.io.to(data.otherUserId).emit("messages_read", { conversationId: data.conversationId });
        } catch (error) {
            this.logger.error("Error marking messages as read:", { error });
        }
      });

      socket.on("send_message", async (data: SendMessageData) => {
        try {
          this.logger.info("Socket send_message received:", { 
            senderId: data.senderId, 
            senderType: data.senderType,
            receiverId: data.receiverId,
            receiverType: data.receiverType
          });

          // Validate data before processing
          if (!data.senderId || !data.receiverId) {
            throw new Error("Missing senderId or receiverId");
          }
          if (!data.senderType || !data.receiverType) {
            throw new Error("Missing senderType or receiverType");
          }
          if (data.senderId === data.receiverId) {
            throw new Error("Cannot send message to yourself");
          }

          const sendMessageUseCase = container.get<SendMessageUseCase>(TYPES.SendMessageUseCase);
          const savedMessage = await sendMessageUseCase.execute(data);

          // Emit to sender for confirmation
          socket.emit("new_message", savedMessage);
          // Also emit to sender's other devices if any (using room)
          socket.to(data.senderId).emit("new_message", savedMessage);

          // Emit to receiver
          if (data.receiverType === "company") {
             const companySocketId = this.companySockets.get(data.receiverId);
             if (companySocketId) {
                SocketManager.io.to(companySocketId).emit("new_message", savedMessage);
             }
             // Also emit to company room
             SocketManager.io.to(data.receiverId).emit("new_message", savedMessage);
          } else {
             const userSocketId = this.userSockets.get(data.receiverId);
             if (userSocketId) {
                SocketManager.io.to(userSocketId).emit("new_message", savedMessage);
             }
             // Also emit to user room
             SocketManager.io.to(data.receiverId).emit("new_message", savedMessage);
          }
          
          this.logger.info(`Message sent from ${data.senderId} to ${data.receiverId}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to send message";
          this.logger.error("Socket send_message error:", { error, errorMessage });
          socket.emit("error", { message: errorMessage });
        }
      });

      socket.on("disconnect", () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
        let disconnectedUserId: string | undefined;
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            disconnectedUserId = userId;
            break;
          }
        }
        
        if (disconnectedUserId) {
            socket.broadcast.emit("user_status", { userId: disconnectedUserId, status: "offline" });
        }
      });
    });
  }

  public static getInstance(): SocketIOServer {
    return SocketManager.io;
  }
}
