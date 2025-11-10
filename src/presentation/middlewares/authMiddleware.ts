import { Request, Response, NextFunction, RequestHandler } from "express";
import { IJwtService } from "../../domain/services/IJWTService.js";
import { IGetRepositoryDataUseCase } from "../../application/interfaces/use-cases/IGetRepositoryDataUseCase.js";
import { HttpStatusCode } from "../../shared/constants/statusCodes.js";
import { AppError } from "../../shared/error/AppError.js";
import { cookieData } from "../../shared/constants/cookieData.js";
import { logger } from "../../infrastructure/logger/logger.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";

interface IRepoData {
  status?: string;
  email: string;
  name: string;
  userId: UniqueEntityID; // ✅ instead of _id
}
export class Authenticate<Entity> {
  constructor(
    private jwtService: IJwtService,
    private getRepositoryDataUseCase: IGetRepositoryDataUseCase<Entity>
  ) {}

  verify: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // --- 🔍 Step 1: Log cookies coming from frontend ---
      console.log("🍪 Incoming Cookies:", req.cookies);

      const { accessToken, refreshToken } = req.cookies;

      if (!accessToken && !refreshToken) {
        logger.error("🚫 No refresh/access token provided");
        return res
          .status(HttpStatusCode.UNAUTHORIZED)
          .json({ status: false, message: "Login expired" });
      }

      // ✅ 1. Validate Access Token first
      if (accessToken) {
        console.log("🔑 Verifying Access Token...");
        const tokenData = this.jwtService.verifyAccessToken(accessToken);
        console.log("📦 Decoded Token Data:", tokenData);

        if (tokenData) {
          const foundUser = (await this.getRepositoryDataUseCase.OneDocumentById(
            tokenData.userId
          )) as IRepoData;

          console.log("🧩 Fetched User from DB:", foundUser);

          if (!foundUser) throw new AppError("User not found", HttpStatusCode.NOT_FOUND);

          if (foundUser.status === "banned") {
            logger.error("⛔ User is banned");
            this.clearCookies(res);
            return res
              .status(HttpStatusCode.UNAUTHORIZED)
              .json({ status: false, message: "This account is banned" });
          }

          req.user = {
            role: tokenData.role,
            email: foundUser.email,
            name: foundUser.name,
            id: foundUser.userId?.toString(), // ✅ FIXED
          };

          console.log("✅ Attached user to req.user:", req.user);
          return next();
        }
      }

      // ✅ 2. If Access Token invalid, use Refresh Token
      if (refreshToken) {
        console.log("🔁 Using Refresh Token...");
        const userPayload = this.jwtService.verifyRefreshToken(refreshToken);
        console.log("📦 Decoded Refresh Token Payload:", userPayload);

        const { exp, iat, ...payload } = userPayload;

        // Generate a new access token
        const newAccessToken = this.jwtService.signAccessToken(payload);
        console.log("🆕 Issued new access token");

        // simplified cookie settings (no env usage)
        res.cookie("accessToken", newAccessToken, {
          httpOnly: true,
          secure: false, // set to true only if using HTTPS
          sameSite: "strict",
          maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
        });

        const foundUser = (await this.getRepositoryDataUseCase.OneDocumentById(
          userPayload.userId
        )) as IRepoData;

        console.log("🧩 Fetched User from DB (Refresh):", foundUser);

        if (!foundUser)
          throw new AppError("User not found", HttpStatusCode.NOT_FOUND);

        req.user = {
          role: payload.role,
          email: foundUser.email,
          name: foundUser.name,
          id: foundUser.userId?.toString(), // ✅ valid now
        };

        console.log("✅ Attached user after refresh:", req.user);
        return next();
      }

      // If neither token worked
      console.log("❌ Neither token valid - clearing cookies");
      this.clearCookies(res);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ status: false, message: "Authentication failed" });
    } catch (error: any) {
      logger.error("💥 Error in authentication middleware:", error.message);
      console.error("Stack Trace:", error.stack);
      this.clearCookies(res);
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ status: false, message: "Invalid or expired token" });
    }
  };

  private clearCookies(res: Response) {
    console.log("🧹 Clearing cookies...");
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });
  }
}
