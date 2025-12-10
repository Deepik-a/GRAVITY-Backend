import { Request, Response, NextFunction, RequestHandler } from "express";
import { IJwtService } from "../../domain/services/IJWTService.js";
import { cookieData } from "../../shared/constants/cookieData.js";
import { StatusCode } from "../../domain/enums/StatusCode.js";
import { Messages } from "../../shared/constants/message.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../infrastructure/DI/types.js";
@injectable()
export class SessionAuth {
  constructor(@inject(TYPES.JwtService) private _jwtService: IJwtService) {}

  verify: RequestHandler = async (req, res, next) => {
    try {
      console.log("🔍 Incoming request:", req.method, req.originalUrl);
      console.log("🔍 Cookies received:", req.cookies);
      const { accessToken, refreshToken } = req.cookies;

      // No tokens → not logged in
      if (!accessToken && !refreshToken) {
        console.log("❌ No access or refresh token found");
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ status: false, message: Messages.AUTH.LOGIN_EXPIRED });
      }

      // 🔹 1. Try Access Token first
      if (accessToken) {
        console.log("🔎 Trying access token...");
        const payload = this._jwtService.verifyAccessToken(accessToken);

        if (payload) {
          console.log("✅ Access token verified. Payload:", payload); // DEBUG
          req.user = {
            id: payload.userId,
            role: payload.role,
            email: payload.email,
            name: payload.name,
          };
          console.log("👤 Set req.user:", req.user); // DEBUG

          return next();
        }
        console.log("⚠️ Access token invalid");
      }

      // 🔹 2. Access Token invalid → try Refresh Token
      if (refreshToken) {
        console.log("🔎 Trying refresh token...");
        const payload = this._jwtService.verifyRefreshToken(refreshToken);
        if (!payload) {
          console.log("❌ Refresh token invalid → ending session");
          return this.endSession(res);
        }

        console.log("🔄 Refresh token valid → issuing new access token");

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { exp, iat, ...data } = payload;

        // Issue new access token
        const newAccessToken = this._jwtService.signAccessToken(data);

        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
        });

        req.user = {
          id: payload.userId,
          role: payload.role,
          email: payload.email,
          name: payload.name,
        };
        console.log("👤 Set req.user from refresh:", req.user); // DEBUG

        return next();
      }

      return this.endSession(res);
    } catch {
      return this.endSession(res);
    }
  };

  authorize(allowedRoles: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      console.log("🛡️ [Middleware] Authorize check");
      console.log(`🎯 Required Roles: ${allowedRoles.join(", ")}`);
      
      if (!req.user) {
        console.log("❌ No req.user found unexpectedly in authorize");
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ status: false, message: Messages.AUTH.LOGIN_EXPIRED });
      }

      console.log(`👤 Current User Role: '${req.user.role}'`);

      if (!allowedRoles.includes(req.user.role)) {
        console.log("⛔ Access Denied: Role mismatch");
        return res
          .status(StatusCode.FORBIDDEN)
          .json({ status: false, message: "Access Denied: Insufficient Permissions" });
      }
      
      console.log("✅ Access Granted");
      next();
    };
  }

  private endSession(res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(StatusCode.UNAUTHORIZED).json({
      status: false,
      message: Messages.AUTH.INVALID_TOKEN,
    });
  }
}
