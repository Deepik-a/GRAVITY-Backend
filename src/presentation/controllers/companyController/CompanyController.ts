import type { Request, Response, NextFunction } from "express";
import { RegisterUseCase } from "../../../application/use-cases/user/SignupUserUsecase.js";
import { LoginUserUseCase } from "../../../application/use-cases/user/LoginUserUseCase.js";
import { GoogleAuthUseCase } from "../../../application/use-cases/user/GoogleAuthUseCase.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";
import { ForgotPasswordUseCase } from "../../../application/use-cases/user/ForgotPasswordUseCase.js";
import { ResetPasswordUseCase } from "../../../application/use-cases/user/ResetPasswordUseCase .js";
import { ResendOtpUseCase } from "../../../application/use-cases/user/ResendOtpUseCase.js";

import { CompanyRepository } from "../../../infrastructure/repositories/CompanyRepository.js"; // ✅ FIXED
import { OtpService } from "../../../application/providers/OTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";
import { IJwtService } from "../../../domain/services/IJWTService.js";
import { verifyGoogleToken } from "../../../infrastructure/stratergies/googleStratergy.js";

export class CompanyController {
  private companyRepository = new CompanyRepository(); // ✅ FIXED
  private otpService = new OtpService();

  constructor(
    private jwtService: IJwtService,
    private role: "user" | "admin" | "company" = "company" // ✅ default role = company
  ) {}

  // ----------------- LOCAL SIGNUP -----------------
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new RegisterUseCase(this.companyRepository, this.otpService, this.role); // ✅ uses CompanyRepo
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ----------------- LOCAL LOGIN -----------------
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new LoginUserUseCase(this.companyRepository, this.jwtService, this.role); // ✅ uses CompanyRepo
      const { user, accessToken, refreshToken } = await useCase.execute(req.body);

      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Company login successful", user });
    } catch (error) {
      next(error);
    }
  }

  // ----------------- GOOGLE LOGIN -----------------
  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      if (!token) throw new Error("Missing Google token");

      const googleUser = await verifyGoogleToken(token);

      const googleSignUpData = {
        ...googleUser,
        role: this.role, // ✅ 'company'
        status: "pending" as const,
      };

      const useCase = new GoogleAuthUseCase(this.companyRepository, this.jwtService, this.role); // ✅ uses CompanyRepo
      const { user, accessToken, refreshToken } = await useCase.execute(googleSignUpData);

      const isProduction = process.env.NODE_ENV === "production";

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 15 * 60 * 1000,
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Google login successful (company)", user });
    } catch (error) {
      next(error);
    }
  }

  // ----------------- OTP -----------------
async verifyOtp(req: Request, res: Response, next: NextFunction) {
  console.log("📩 [Controller] verifyOtp() called");

  try {
    // Log incoming request data
    console.log("📦 Request body:", req.body);

    const { email, otp } = req.body;

    // Validate presence
    if (!email || !otp) {
      console.warn("⚠️ Missing email or OTP in request body");
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    console.log("🏢 Using CompanyRepository for OTP verification...");
    const useCase = new VerifyOtpUseCase(this.companyRepository);

    console.log("⚙️ Executing VerifyOtpUseCase with:", {
      email,
      otp,
      purpose: OtpPurpose.SIGNUP,
    });

    const result = await useCase.execute(email, otp, OtpPurpose.SIGNUP);

    if (!result) {
      console.error("❌ VerifyOtpUseCase returned no result");
      return res.status(500).json({ message: "Unexpected error: no result returned" });
    }

    const { accessToken, refreshToken, user } = result;
    console.log("✅ OTP verified successfully, tokens created:", {
      accessTokenSnippet: accessToken?.slice(0, 20) + "...",
      refreshTokenSnippet: refreshToken?.slice(0, 20) + "...",
    });

    const isProduction = process.env.NODE_ENV === "production";
    console.log("🌍 Environment:", isProduction ? "Production" : "Development");

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("🍪 Cookies set successfully");

    res.status(200).json({
      message: "OTP verified successfully (company)",
      user,
    });

    console.log("🚀 [verifyOtp] Response sent successfully");
  } catch (error: any) {
    console.error("💥 [verifyOtp] Error caught:", error.message || error);
    next(error);
  }
}


  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });

      const useCase = new ResendOtpUseCase();
      const result = await useCase.execute(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ----------------- FORGOT / RESET PASSWORD -----------------
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new ForgotPasswordUseCase(this.companyRepository, this.otpService); // ✅ uses CompanyRepo
      const result = await useCase.execute(req.body.email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const useCase = new VerifyOtpUseCase(this.companyRepository); // ✅ uses CompanyRepo
      const result = await useCase.execute(email, otp, OtpPurpose.FORGOT_PASSWORD);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, newPassword } = req.body;
      const useCase = new ResetPasswordUseCase(this.companyRepository); // ✅ uses CompanyRepo
      const result = await useCase.execute(email, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
