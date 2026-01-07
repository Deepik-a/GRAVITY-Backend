import { Request, Response, NextFunction } from "express";
import { StatusCode } from "@/domain/enums/StatusCode";

// Use Cases
import { RegisterUseCase } from "@/application/use-cases/user/RegisterUseCase";
import { LoginUserUseCase } from "@/application/use-cases/user/LoginUserUseCase";
import { GoogleAuthUseCase } from "@/application/use-cases/user/GoogleAuthUseCase";
import { VerifyOtpUseCase } from "@/application/use-cases/user/VerifyOtpUseCase";
import { ForgotPasswordUseCase } from "@/application/use-cases/user/ForgotPasswordUseCase";
import { ResetPasswordUseCase } from "@/application/use-cases/user/ResetPasswordUseCase";
import { ResendOtpUseCase } from "@/application/use-cases/user/ResendOtpUseCase";
import { DetectUserRoleUseCase } from "@/application/use-cases/user/DetectUserRoleUseCase";
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
       @inject(TYPES.DetectUserRoleUseCase) private readonly _detectUserRoleUseCase: DetectUserRoleUseCase,
      @inject(TYPES.LoginUserUseCase)  private readonly _loginUseCase: LoginUserUseCase,
      @inject(TYPES.ForgotPasswordUseCase)  private readonly _forgotPasswordUseCase: ForgotPasswordUseCase,
      @inject(TYPES.VerifyOtpUseCase)  private readonly _verifyOtpUseCase: VerifyOtpUseCase,
      @inject(TYPES.ResetPasswordUseCase)  private readonly _resetPasswordUseCase: ResetPasswordUseCase,
      @inject(TYPES.RegisterUseCase)  private readonly _registerUseCase: RegisterUseCase,
      @inject(TYPES.ResendOtpUseCase) private readonly _resendOtpUseCase: ResendOtpUseCase,
       @inject(TYPES.GoogleAuthUseCase) private readonly _googleAuthUseCase: GoogleAuthUseCase,
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


    // ✅ User Specific Cookies
    res.cookie("userAccessToken", result.accessToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
      path: "/", 
    });

    res.cookie("userRefreshToken", result.refreshToken, {
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

    // ✅ User Specific Cookies
    res.cookie("userAccessToken", result.accessToken, {
      httpOnly: cookieData.httpONLY,
      secure: cookieData.SECURE,
      sameSite: cookieData.SAME_SITE,
      maxAge: cookieData.MAX_AGE_ACCESS_TOKEN,
      path: "/",
    });

    res.cookie("userRefreshToken", result.refreshToken, {
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
}
