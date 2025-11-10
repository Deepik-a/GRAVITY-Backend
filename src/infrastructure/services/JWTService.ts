import jwt from "jsonwebtoken";
import { IJwtService } from "../../domain/services/IJWTService.js";
import { env } from "../../infrastructure/config/env.js";

export class JwtService implements IJwtService {

  signAccessToken(payload: Record<string, any>): string {
    console.log("🧠 [JWT] Signing Access Token with payload:", payload);
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
    console.log("🔐 [JWT] Access Token created:", token);
    return token;
  }

  signRefreshToken(payload: Record<string, any>): string {
    console.log("🧠 [JWT] Signing Refresh Token with payload:", payload);
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    console.log("🔐 [JWT] Refresh Token created:", token);
    return token;
  }

  verifyAccessToken(token: string): any {
    console.log("🧠 [JWT] Verifying Access Token...");
    console.log("📜 [JWT] Raw Access Token:", token);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    console.log("📦 [JWT] Decoded Access Token Payload:", decoded);
    return decoded;
  }

  verifyRefreshToken(token: string): any {
    console.log("🧠 [JWT] Verifying Refresh Token...");
    console.log("📜 [JWT] Raw Refresh Token:", token);
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    console.log("📦 [JWT] Decoded Refresh Token Payload:", decoded);
    return decoded;
  }
}
