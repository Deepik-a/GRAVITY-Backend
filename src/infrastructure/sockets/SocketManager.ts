import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { env } from "@/infrastructure/config/env";
import { SendMessageUseCase } from "@/application/use-cases/chat/SendMessageUseCase";
import { ILogger } from "@/domain/services/ILogger";
import { IChatRepository } from "@/domain/repositories/IChatRepository";
import { INotification } from "@/domain/entities/Notification";

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
  private userSockets = new Map<string, string>(); // userId -> socketId
  private companySockets = new Map<string, string>(); // companyId -> socketId

  constructor(server: HttpServer) {
    this.logger = container.get<ILogger>(TYPES.Logger);
    SocketManager.io = new SocketIOServer<object, object, object, object>(server, {
      cors: {
        origin: env.FRONTEND_URL,
        credentials: true,
      },
    });

    this.init();
  }

  private init() {
    this.logger.info("Initializing Socket.io");

    SocketManager.io.on("connection", (socket: Socket) => {
      this.logger.info(`New client connected: ${socket.id}`);

      socket.on("join", async (data: { userId: string, type: "user" | "company" } | string) => {
        let userId: string;
        let type: "user" | "company" = "user";

        if (typeof data === "string") {
            userId = data;
        } else {
            userId = data.userId;
            type = data.type;
        }

        this.logger.info(`${type === "company" ? "Company" : "User"} ${userId} joined with socket ${socket.id}`);
        
        if (type === "company") {
            this.companySockets.set(userId, socket.id);
        } else {
            this.userSockets.set(userId, socket.id);
        }
        
        // Join role-specific room to prevent notification leakage
        socket.join(`${type}:${userId}`);
        
        // Broadcast online status
        socket.broadcast.emit("user_status", { userId, status: "online", type });
        
        // Send list of online users/companies
        const onlineUsers = Array.from(this.userSockets.keys());
        const onlineCompanies = Array.from(this.companySockets.keys());
        socket.emit("online_users", [...onlineUsers, ...onlineCompanies]);
      });

      socket.on("typing", (data: { senderId: string, receiverId: string, receiverType: string }) => {
        SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("typing", { userId: data.senderId });
      });

      socket.on("stop_typing", (data: { senderId: string, receiverId: string, receiverType: string }) => {
        SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("stop_typing", { userId: data.senderId });
      });

      socket.on("mark_read", async (data: { conversationId: string, userId: string, otherUserId: string, otherUserType: string }) => {
        try {
            const chatRepository = container.get<IChatRepository>(TYPES.ChatRepository);
            await chatRepository.markMessagesAsRead(data.conversationId, data.userId);
            
            // Notify the sender that messages were read using prefixed room
            SocketManager.io.to(`${data.otherUserType}:${data.otherUserId}`).emit("messages_read", { conversationId: data.conversationId });
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
          socket.to(`${data.senderType}:${data.senderId}`).emit("new_message", savedMessage);

          // Emit to receiver using role-prefixed room
          SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("new_message", savedMessage);
          
          this.logger.info(`Message sent from ${data.senderId} to ${data.receiverId}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Failed to send message";
          this.logger.error("Socket send_message error:", { error, errorMessage });
          socket.emit("error", { message: errorMessage });
        }
      });

      // --- Video Call Signaling ---
      socket.on("call_user", (data: { callerId: string, callerName: string, receiverId: string, receiverType: string, offer: unknown }) => {
        this.logger.info(`Call attempt from ${data.callerId} to ${data.receiverId}`);
        SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("incoming_call", {
          callerId: data.callerId,
          callerName: data.callerName,
          offer: data.offer
        });
      });

      socket.on("answer_call", (data: { callerId: string, callerType: string, answer: unknown }) => {
        this.logger.info(`Call answered by ${data.callerId}`);
        SocketManager.io.to(`${data.callerType}:${data.callerId}`).emit("call_answered", {
          answer: data.answer
        });
      });

      socket.on("decline_call", (data: { callerId: string, callerType: string }) => {
        this.logger.info(`Call declined by ${data.callerId}`);
        SocketManager.io.to(`${data.callerType}:${data.callerId}`).emit("call_declined");
      });

      socket.on("ice_candidate", (data: { receiverId: string, receiverType: string, candidate: unknown }) => {
        SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("ice_candidate", {
          candidate: data.candidate
        });
      });

      socket.on("end_call", (data: { receiverId: string, receiverType: string }) => {
        SocketManager.io.to(`${data.receiverType}:${data.receiverId}`).emit("call_ended");
      });

      socket.on("disconnect", () => {
        this.logger.info(`Client disconnected: ${socket.id}`);
        let disconnectedUserId: string | undefined;
        let disconnectedType: "user" | "company" = "user";

        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            disconnectedUserId = userId;
            disconnectedType = "user";
            break;
          }
        }
        
        if (!disconnectedUserId) {
          for (const [userId, socketId] of this.companySockets.entries()) {
            if (socketId === socket.id) {
              this.companySockets.delete(userId);
              disconnectedUserId = userId;
              disconnectedType = "company";
              break;
            }
          }
        }
        
        if (disconnectedUserId) {
            socket.broadcast.emit("user_status", { userId: disconnectedUserId, status: "offline", type: disconnectedType });
        }
      });
    });
  }

  public static getInstance(): SocketIOServer {
    return SocketManager.io;
  }

  public static sendNotification(recipientId: string, recipientType: string, notification: INotification) {
    if (SocketManager.io) {
      SocketManager.io.to(`${recipientType}:${recipientId}`).emit("notification", notification);
    }
  }
}
