import jwt from "jsonwebtoken";
import { IJwtService } from "@/domain/services/IJWTService";
import { env } from "@/infrastructure/config/env";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger";

@injectable()
export class JwtService implements IJwtService {
  constructor(
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  signAccessToken(payload: Record<string, unknown>): string {
    this._logger.info("🧠 [JWT] Signing Access Token with payload:", { payload });
    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRATION });
    this._logger.info("🔐 [JWT] Access Token created:", { token });
    return token;
  }

  signRefreshToken(payload: Record<string, unknown>): string {
    this._logger.info("🧠 [JWT] Signing Refresh Token with payload:", { payload });
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRATION });
    this._logger.info("🔐 [JWT] Refresh Token created:", { token });
    return token;
  }

  verifyAccessToken(token: string): Record<string, unknown> {
    this._logger.info("🧠 [JWT] Verifying Access Token...", { token });
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as Record<string, unknown>;
    this._logger.info("📦 [JWT] Decoded Access Token Payload:", { decoded });
    return decoded;
  }

  verifyRefreshToken(token: string): Record<string, unknown> {
    this._logger.info("🧠 [JWT] Verifying Refresh Token...", { token });
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as Record<string, unknown>;
    this._logger.info("📦 [JWT] Decoded Refresh Token Payload:", { decoded });
    return decoded;
  }
}
