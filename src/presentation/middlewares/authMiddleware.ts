  import { Request, Response, NextFunction, RequestHandler } from "express";
  import { IJwtService } from "@/domain/services/IJWTService";
  import { cookieData } from "@/shared/constants/cookieData";
  import { StatusCode } from "@/domain/enums/StatusCode";
  import { Messages } from "@/shared/constants/message";
  import { inject, injectable } from "inversify";
  import { TYPES } from "@/infrastructure/DI/types";
  import { ILogger } from "@/domain/services/ILogger";

  import { IAuthRepository } from "@/domain/repositories/IAuthRepository";

@injectable()
export class SessionAuth {
  constructor(
    @inject(TYPES.JwtService) private _jwtService: IJwtService,
    @inject(TYPES.Logger) private readonly _logger: ILogger,
    @inject(TYPES.UserRepository) private _userRepository: IAuthRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: IAuthRepository,
  ) {}

  verify: RequestHandler = async (req, res, next) => {
      const isAdminRoute = req.originalUrl.startsWith("/admin");
      const accessKey = isAdminRoute ? "adminAccessToken" : "userAccessToken";
      const refreshKey = isAdminRoute ? "adminRefreshToken" : "userRefreshToken";
    try {

      const accessToken = req.cookies[accessKey];
      const refreshToken = req.cookies[refreshKey];

      if (!accessToken && !refreshToken) {
        return res.status(StatusCode.UNAUTHORIZED).json({ status: false, message: Messages.AUTH.LOGIN_EXPIRED });
      }

      if (accessToken) {
      
        const payload = this._jwtService.verifyAccessToken(accessToken);
        this._logger.info("Token Payload Found:", payload); // ലോഗ് ചേർക്കുക
        if (payload) {
          req.user = {
            id: (payload.userId || payload.id) as string,
            role: payload.role as string,
            email: payload.email as string,
            name: payload.name as string,
          };

          if (await this._checkBlockStatus(req.user.role, req.user.id)) {
            this._clearSpecificCookies(res, accessKey, refreshKey);
            return res.status(StatusCode.FORBIDDEN).json({ status: false, message: Messages.AUTH.ACCOUNT_BLOCKED });
          }
          return next();
        }
      }

      if (refreshToken) {
        const payload = this._jwtService.verifyRefreshToken(refreshToken);
        if (!payload) return this._endSpecificSession(res, accessKey, refreshKey);

        if (await this._checkBlockStatus(payload.role as string, (payload.userId || payload.id) as string)) {
          this._clearSpecificCookies(res, accessKey, refreshKey);
          return res.status(StatusCode.FORBIDDEN).json({ status: false, message: Messages.AUTH.ACCOUNT_BLOCKED });
        }

        const {  ...data } = payload;
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
        };
        return next();
      }

      return this._endSpecificSession(res, accessKey, refreshKey);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this._logger.error("Auth Catch Error:", { error });
      return this._endSpecificSession(res, isAdminRoute ? "adminAccessToken" : "userAccessToken", isAdminRoute ? "adminRefreshToken" : "userRefreshToken");
    }
  };

  authorize(allowedRoles: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(StatusCode.FORBIDDEN).json({ status: false, message: "Access Denied" });
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
  const repo = role === "company" ? this._companyRepository : this._userRepository;
  
  // 3. ഡാറ്റാബേസിൽ നിന്ന് യൂസറെ സെർച്ച് ചെയ്യുന്നു
  const user = await repo.findById(userId);

  // ഡീബഗ്ഗിംഗിനായി ഈ ലോഗുകൾ ഉപയോഗിക്കുക
  this._logger.info(`🔍 Block Check: Role=${role}, ID=${userId}, isBlocked=${user?.isBlocked}`);
  this._logger.info("Raw User Data from Repo:", { 
  id: userId, 
  isBlockedInDB: user?.isBlocked 
});

  // യൂസർ ഇല്ലെങ്കിലോ ബ്ലോക്ക് ട്രൂ ആണെങ്കിലോ ട്രൂ റിട്ടേൺ ചെയ്യും
  return !!user?.isBlocked;
}
}