  import { Request, Response, NextFunction, RequestHandler } from "express";
  import { IJwtService } from "@/domain/services/IJWTService";
  import { cookieData } from "@/shared/constants/cookieData";
  import { StatusCode } from "@/domain/enums/StatusCode";
  import { Messages } from "@/shared/constants/message";
  import { inject, injectable } from "inversify";
  import { TYPES } from "@/infrastructure/DI/types";
  import { ILogger } from "@/domain/services/ILogger";

  import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { AuthenticatedUser } from "@/types/auth";

@injectable()
export class SessionAuth {
  constructor(
    @inject(TYPES.JwtService) private _jwtService: IJwtService,
    @inject(TYPES.Logger) private readonly _logger: ILogger,
    @inject(TYPES.UserRepository) private _userRepository: IAuthRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: IAuthRepository,
  ) {}

  verify: RequestHandler = async (req, res, next) => {
      const isAdminRoute = req.originalUrl.startsWith("/admin") || req.originalUrl.includes("/admin/");
      const accessKey = isAdminRoute ? "adminAccessToken" : "userAccessToken";
      const refreshKey = isAdminRoute ? "adminRefreshToken" : "userRefreshToken";
    try {

      const accessToken = req.cookies[accessKey];
      const refreshToken = req.cookies[refreshKey];

      if (!accessToken && !refreshToken) {
        return res.status(StatusCode.UNAUTHORIZED).json({ status: false, message: Messages.AUTH.LOGIN_EXPIRED });
      }

      if (accessToken) {
        try {
          const payload = this._jwtService.verifyAccessToken(accessToken);
          this._logger.info("Token Payload Found:", payload); 
          if (payload) {
            req.user = {
              id: (payload.userId || payload.id) as string,
              role: payload.role as string,
              email: payload.email as string,
              name: payload.name as string,
            } as AuthenticatedUser;

            const user = req.user as AuthenticatedUser;

            if (await this._checkBlockStatus(user.role, user.id)) {
              this._clearSpecificCookies(res, accessKey, refreshKey);
              return res.status(StatusCode.FORBIDDEN).json({ status: false, message: Messages.AUTH.ACCOUNT_BLOCKED });
            }
            return next();
          }
        } catch {
          this._logger.info("Access token expired or invalid, checking refresh token...");
          // Don't return here, let it fall through to refreshToken check
        }
      }

      if (refreshToken) {
        const payload = this._jwtService.verifyRefreshToken(refreshToken);
        if (!payload) return this._endSpecificSession(res, accessKey, refreshKey);

        if (await this._checkBlockStatus(payload.role as string, (payload.userId || payload.id) as string)) {
          this._clearSpecificCookies(res, accessKey, refreshKey);
          return res.status(StatusCode.FORBIDDEN).json({ status: false, message: Messages.AUTH.ACCOUNT_BLOCKED });
        }

       // പേലോഡിൽ നിന്ന് ആവശ്യമുള്ളവ മാത്രം നേരിട്ട് എടുക്കാം
const data = {
  userId: payload.userId || payload.id,
  role: payload.role,
  email: payload.email,
  name: payload.name
};
        const newAccessToken = this._jwtService.signAccessToken(data);

        res.cookie(accessKey, newAccessToken, {
          httpOnly: true,
          secure: cookieData.SECURE,
          sameSite: cookieData.SAME_SITE,
          maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
          path: "/",
        });

        req.user = { 
          id: (payload.userId || payload.id) as string, 
          role: payload.role as string,
          email: payload.email as string,
          name: payload.name as string,
        } as AuthenticatedUser;
        return next();
      }

      return this._endSpecificSession(res, accessKey, refreshKey);
    } catch (error) {
      this._logger.error("Auth Catch Error:", { error });
      return this._endSpecificSession(res, isAdminRoute ? "adminAccessToken" : "userAccessToken", isAdminRoute ? "adminRefreshToken" : "userRefreshToken");
    }
  };

authorize(allowedRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser | undefined;

    console.log("User Role:", user?.role); // Debugging
    console.log("Allowed Roles:", allowedRoles); // Debugging

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(StatusCode.FORBIDDEN).json({ 
        status: false, 
        message: `Access Denied. Your role is: ${user?.role || "none"}. Required roles: ${allowedRoles.join(", ")}` 
      });
    }
    next();
  };
}

  private _clearSpecificCookies(res: Response, accessKey: string, refreshKey: string) {
    res.clearCookie(accessKey, { path: "/" });
    res.clearCookie(refreshKey, { path: "/" });
  }

  private _endSpecificSession(res: Response, accessKey: string, refreshKey: string) {
    this._clearSpecificCookies(res, accessKey, refreshKey);
    return res.status(StatusCode.UNAUTHORIZED).json({ status: false, message: Messages.AUTH.INVALID_TOKEN });
  }

private async _checkBlockStatus(role: string, userId: string): Promise<boolean> {
  // 1. അഡ്മിൻ ആണെങ്കിൽ ബ്ലോക്ക് ചെക്ക് ഒഴിവാക്കുന്നു
  if (role === "admin") return false;

  // 2. റോൾ അനുസരിച്ച് ശരിയായ റിപ്പോസിറ്ററി തിരഞ്ഞെടുക്കുന്നു
  if (!role) {
    this._logger.error("❌ Block Check Failure: Role is missing", { userId });
    return true; // Assume blocked for safety
  }

  const repo = role === "company" ? this._companyRepository : this._userRepository;
  
  // 3. ഡാറ്റാബേസിൽ നിന്ന് യൂസറെ സെർച്ച് ചെയ്യുന്നു
  const user = await repo.findById(userId);

  // ഡീബഗ്ഗിംഗിനായി ഈ ലോഗുകൾ ഉപയോഗിക്കുക
  this._logger.info(`🔍 Block Check: Role=${role}, ID=${userId}, isBlocked=${user?.isBlocked}`);
  
  if (!user) {
    this._logger.warn("⚠️ Block Check Warning: User not found in database", { role, userId });
    return true; // Deny access if user record is gone
  }

  // യൂസർ ഇല്ലെങ്കിലോ ബ്ലോക്ക് ട്രൂ ആണെങ്കിലോ ട്രൂ റിട്ടേൺ ചെയ്യും
  return !!user.isBlocked;
}
}