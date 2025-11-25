import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
// import userRoutes from "./presentation/routes/userRoutes";
import AdminRoutes from "./presentation/routes/adminRoutes";
import AuthRoutes from "./presentation/routes/AuthRoutes.js";
import CompanyRoutes from './presentation/routes/companyRoutes'
import { connectRedis } from "./infrastructure/config/redis.js";
import { errorHandler } from "./presentation/middlewares/errorMiddleware.js";
import cookieParser from "cookie-parser";

console.log("hello from index.ts good");

const app = express();
console.log("hello before public file");

// must come before routes/middleware that use req.cookies
app.use(cookieParser());

// Serve static files
app.use("/public", express.static(path.join(process.cwd(), "public")));
console.log(process.cwd(), "process.cwd()");

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// ------------ ROUTES ------------
// app.use("/users", userRoutes);
app.use("/admin", AdminRoutes);
app.use("/company", CompanyRoutes);
app.use("/auth", AuthRoutes);

// ------------ ERROR MIDDLEWARE ------------
app.use(errorHandler);

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not defined");

//
//  ✅ FIX: Wrap startup logic in async to avoid "Top-level await" error
//
(async () => {
  try {
    // CONNECT REDIS
    await connectRedis();
    console.log("Redis connected");

    // CONNECT MONGO
    await mongoose.connect(uri);
    console.log("MongoDB connected");

    // START SERVER
    app.listen(5000, () => console.log("Server running on port 5000"));
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }
})();
