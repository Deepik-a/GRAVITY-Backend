import { Request, Response, NextFunction } from "express";
import { StatusCode } from "@/domain/enums/StatusCode";

// Use Case Interfaces
import { IRegisterUseCase } from "@/application/interfaces/use-cases/user/IRegisterUseCase";
import { ILoginUserUseCase } from "@/application/interfaces/use-cases/user/ILoginUserUseCase";
import { IGoogleAuthUseCase } from "@/application/interfaces/use-cases/user/IGoogleAuthUseCase";
import { IVerifyOtpUseCase } from "@/application/interfaces/use-cases/user/IVerifyOtpUseCase";
import { IForgotPasswordUseCase } from "@/application/interfaces/use-cases/user/IForgotPasswordUseCase";
import { IResetPasswordUseCase } from "@/application/interfaces/use-cases/user/IResetPasswordUseCase";
import { IResendOtpUseCase } from "@/application/interfaces/use-cases/user/IResendOtpUseCase";
import { IDetectUserRoleUseCase } from "@/application/interfaces/use-cases/user/IDetectUserRoleUseCase";
import { verifyGoogleToken } from "@/infrastructure/strategies/GoogleStrategy";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { SignupRequestDto } from "@/application/dtos/user/SignupRequestDto";

import { 
  LoginRequestDto, 
  ResendOtpRequestDto, 
  ForgotPasswordRequestDto, 
  VerifyOtpRequestDto, 
  ResetPasswordRequestDto,
  LoginResponseDto,
  GoogleAuthResponseDto,
  ResendOtpResponseDto,
  ForgotPasswordResponseDto,
  VerifyOtpResponseDto,
  ResetPasswordResponseDto,
  DetectRoleResponseDto
} from "@/application/dtos/AuthDTOs";
import { SignupResponseDto } from "@/application/dtos/user/SignupResponseDto";
import { ILogger } from "@/domain/services/ILogger";
import { UserSignUp } from "@/domain/entities/User";
import { AppError } from "@/shared/error/AppError";
import { cookieData } from "@/shared/constants/cookieData";




@injectable()
export class AuthController {

  constructor(
       @inject(TYPES.DetectUserRoleUseCase) private readonly _detectUserRoleUseCase: IDetectUserRoleUseCase,
      @inject(TYPES.LoginUserUseCase)  private readonly _loginUseCase: ILoginUserUseCase,
      @inject(TYPES.ForgotPasswordUseCase)  private readonly _forgotPasswordUseCase: IForgotPasswordUseCase,
      @inject(TYPES.VerifyOtpUseCase)  private readonly _verifyOtpUseCase: IVerifyOtpUseCase,
      @inject(TYPES.ResetPasswordUseCase)  private readonly _resetPasswordUseCase: IResetPasswordUseCase,
      @inject(TYPES.RegisterUseCase)  private readonly _registerUseCase: IRegisterUseCase,
      @inject(TYPES.ResendOtpUseCase) private readonly _resendOtpUseCase: IResendOtpUseCase,
       @inject(TYPES.GoogleAuthUseCase) private readonly _googleAuthUseCase: IGoogleAuthUseCase,
       @inject(TYPES.Logger) private readonly _logger: ILogger,
  ) {}


  // ---------------- REGISTER ----------------
  async register(req: Request, res: Response, next: NextFunction) {
    try {
    
      const signupDto: SignupRequestDto = req.body;
      this._logger.info("Req.body from signup", { signupDto });

      const result: SignupResponseDto = await this._registerUseCase.execute(signupDto);
      return res.status(StatusCode.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- LOGIN ----------------
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const loginDto: LoginRequestDto = req.body;
     this._logger.info("Req.body from login", { loginDto });
    const { repo, role, user }: DetectRoleResponseDto = await this._detectUserRoleUseCase.execute(loginDto.email);
    
    if (!user) throw new AppError("User not found", StatusCode.NOT_FOUND);
    
    if (!role || !repo) {
  throw new AppError("Invalid role or repository", StatusCode.BAD_REQUEST);
}

    const result: LoginResponseDto = await this._loginUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
      repo,
      role,
      user: user as UserSignUp,
    });


    const accessKey = role === "company" ? "companyAccessToken" : "userAccessToken";
    const refreshKey = role === "company" ? "companyRefreshToken" : "userRefreshToken";

    const otherAccessKey = role === "company" ? "userAccessToken" : "companyAccessToken";
    const otherRefreshKey = role === "company" ? "userRefreshToken" : "companyRefreshToken";

    // Clear potential stale tokens for the other role
    res.clearCookie(otherAccessKey, { path: "/" });
    res.clearCookie(otherRefreshKey, { path: "/" });
    res.clearCookie("adminAccessToken", { path: "/" });
    res.clearCookie("adminRefreshToken", { path: "/" });

    res.cookie(accessKey, result.accessToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
      path: "/", 
    });

    res.cookie(refreshKey, result.refreshToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
      path: "/",
    });


    return res.status(StatusCode.SUCCESS).json(result);
  } catch (err) {
    next(err);
  }
}


  // ---------------- GOOGLE LOGIN ----------------
async googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    this._logger.info("========== 🟩 Google Login START ==========");
    const { token, role: frontendRole } = req.body;

    if (!token) throw new AppError("Google token required", StatusCode.BAD_REQUEST);

    const googlePayload = await verifyGoogleToken(token);
    const email = googlePayload.email;

    const { repo, user, isNewUser }: DetectRoleResponseDto = 
      await this._detectUserRoleUseCase.execute(email);

    const result: GoogleAuthResponseDto = await this._googleAuthUseCase.execute({
      googleUser: { name: googlePayload.name, email, googleId: googlePayload.googleId },
      repo: repo || undefined,
      existingUser: user,
      frontendRole: isNewUser ? frontendRole : undefined,
    });

    const accessKey = result.user.role === "company" ? "companyAccessToken" : "userAccessToken";
    const refreshKey = result.user.role === "company" ? "companyRefreshToken" : "userRefreshToken";

    const otherAccessKey = result.user.role === "company" ? "userAccessToken" : "companyAccessToken";
    const otherRefreshKey = result.user.role === "company" ? "userRefreshToken" : "companyRefreshToken";

    // Clear potential stale tokens for the other role
    res.clearCookie(otherAccessKey, { path: "/" });
    res.clearCookie(otherRefreshKey, { path: "/" });
    res.clearCookie("adminAccessToken", { path: "/" });
    res.clearCookie("adminRefreshToken", { path: "/" });

    res.cookie(accessKey, result.accessToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
      path: "/",
    });

    res.cookie(refreshKey, result.refreshToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
      path: "/",
    });


    return res.status(StatusCode.SUCCESS).json(result);
  } catch (err) {
    next(err);
  }
}






  // ---------------- RESEND OTP ----------------
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const resendDto: ResendOtpRequestDto = req.body;
      const result: ResendOtpResponseDto = await this._resendOtpUseCase.execute(resendDto);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- FORGOT PASSWORD ----------------
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const forgotDto: ForgotPasswordRequestDto = req.body;
      const result: ForgotPasswordResponseDto = await this._forgotPasswordUseCase.execute(forgotDto);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- VERIFY OTP ----------------
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const verifyDto: VerifyOtpRequestDto = req.body;  
        this._logger.info("req.body from verifyotp", { verifyDto });
      const result: VerifyOtpResponseDto = await this._verifyOtpUseCase.execute(verifyDto);

      if (result.success && result.accessToken && result.refreshToken && result.role) {
        const accessKey = result.role === "company" ? "companyAccessToken" : "userAccessToken";
        const refreshKey = result.role === "company" ? "companyRefreshToken" : "userRefreshToken";

        const otherAccessKey = result.role === "company" ? "userAccessToken" : "companyAccessToken";
        const otherRefreshKey = result.role === "company" ? "userRefreshToken" : "companyRefreshToken";

        // Clear potential stale tokens for the other role
        res.clearCookie(otherAccessKey, { path: "/" });
        res.clearCookie(otherRefreshKey, { path: "/" });
        res.clearCookie("adminAccessToken", { path: "/" });
        res.clearCookie("adminRefreshToken", { path: "/" });

        res.cookie(accessKey, result.accessToken, {
          httpOnly: cookieData.httpONLY,
          secure: cookieData.SECURE,
          sameSite: cookieData.SAME_SITE,
          maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
          path: "/",
        });

        res.cookie(refreshKey, result.refreshToken, {
          httpOnly: cookieData.httpONLY,
          secure: cookieData.SECURE,
          sameSite: cookieData.SAME_SITE,
          maxAge: cookieData.MAX_AGE_REFRESH_TOKEN,
          path: "/",
        });
      }


      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- RESET PASSWORD ----------------
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const resetDto: ResetPasswordRequestDto = req.body;
      const result: ResetPasswordResponseDto = await this._resetPasswordUseCase.execute(resetDto);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- LOGOUT ----------------
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdminRoute = req.originalUrl.startsWith("/admin");
      const isCompanyRoute = req.originalUrl.startsWith("/company");
      
      let accessKey = "userAccessToken";
      let refreshKey = "userRefreshToken";

      if (isAdminRoute) {
        accessKey = "adminAccessToken";
        refreshKey = "adminRefreshToken";
      } else if (isCompanyRoute) {
        accessKey = "companyAccessToken";
        refreshKey = "companyRefreshToken";
      }

      res.clearCookie(accessKey, { path: "/" });
      res.clearCookie(refreshKey, { path: "/" });

      return res.status(StatusCode.SUCCESS).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }
}
