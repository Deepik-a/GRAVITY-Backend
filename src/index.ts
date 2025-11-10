
import dotenv from "dotenv";
dotenv.config();


import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import userRoutes from "./presentation/routes/userRoutes.js";
import { connectRedis } from "./infrastructure/config/redis.js";
import {errorHandler} from './presentation/middlewares/errorMiddleware.js'
import cookieParser from "cookie-parser";

console.log("hello from index.ts good")


const app = express();
console.log("hello before public file")

// must come before routes/middleware that use req.cookies
app.use(cookieParser());


// 👉 Serve static files from the 'public' folder
app.use("/public", express.static(path.join(process.cwd(), "public")));
console.log(process.cwd(),"process.cwd()");


// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',  // frontend URL
  credentials: true                 // allow cookies/auth headers
}));

app.use(express.json());
app.use("/api/users", userRoutes);

app.use(errorHandler)

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is not defined");


// ✅ CONNECT TO REDIS
await connectRedis();


mongoose.connect(uri)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


app.listen(5000, () => console.log("Server running on port 5000"));
