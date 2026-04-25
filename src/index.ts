import "tsconfig-paths/register";
import { env } from "@/infrastructure/config/env";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import AdminRoutes from "@/presentation/routes/adminRoutes";
import AuthRoutes from "@/presentation/routes/AuthRoutes";
import UserRoutes from "@/presentation/routes/userRoutes";
import CompanyRoutes from "@/presentation/routes/companyRoutes";
import PaymentRoutes from "@/presentation/routes/PaymentRoutes";
import SubscriptionRoutes from "@/presentation/routes/SubscriptionRoutes";
import ChatRoutes from "@/presentation/routes/ChatRoutes";
import NotificationRoutes from "@/presentation/routes/NotificationRoutes";
import { connectRedis } from "@/infrastructure/config/redis";
import { errorHandler } from "@/presentation/middlewares/ErrorMiddleware";
import cookieParser from "cookie-parser";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger";

import { createServer } from "http";
import { SocketManager } from "@/infrastructure/sockets/SocketManager";
import { ReminderService } from "@/application/services/ReminderService";

const logger = container.get<ILogger>(TYPES.Logger);
const reminderService = container.get<ReminderService>(TYPES.ReminderService);

logger.info("hello from index.ts good");

const app = express();
const httpServer = createServer(app);
new SocketManager(httpServer);
logger.info("hello before public file");

// must come before routes/middleware that use req.cookies
app.use(cookieParser());

// Serve static files
app.use("/public", express.static(path.join(process.cwd(), "public")));
logger.info(process.cwd(), { cwd: process.cwd() });

// CORS


app.use(
  cors({
    origin: [env.FRONTEND_URL, env.FRONTEND_URL.replace("www.", "")],
    credentials: true,
  })
);

// MUST NOT use express.json() before Stripe webhook as it needs raw body for signature verification
app.use("/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

// ------------ ROUTES ------------
// app.use("/users", userRoutes);
app.use("/admin", AdminRoutes);
app.use("/company", CompanyRoutes);
app.use("/auth", AuthRoutes);
app.use("/user",UserRoutes);
app.use("/payments", PaymentRoutes);
app.use("/subscriptions", SubscriptionRoutes);
app.use("/chat", ChatRoutes);
app.use("/notifications", NotificationRoutes);

// ------------ ERROR MIDDLEWARE ------------
app.use(errorHandler);

const uri = env.MONGO_URI;

//
//  FIX: Wrap startup logic in async to avoid "Top-level await" error
//
(async () => {
  try {
    // CONNECT REDIS
    await connectRedis();
    logger.info("Redis connected");

    // CONNECT MONGO
    await mongoose.connect(uri);
    logger.info("MongoDB connected");

    // START REMINDERS
    reminderService.startReminderTask();

    // START SERVER
    httpServer.listen(env.PORT, () => logger.info(`Server running on port ${env.PORT}`));
  } catch (error) {
    logger.error("Startup error:", { error });
    process.exit(1);
  }
})();
