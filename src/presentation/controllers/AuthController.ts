import { Request, Response, NextFunction } from "express";
import { StatusCode } from "../../domain/enums/StatusCode";

// Use Cases
import { RegisterUseCase } from "../../application/use-cases/user/SignupUserUsecase.js";
import { LoginUserUseCase } from "../../application/use-cases/user/LoginUserUseCase.js";
import { GoogleAuthUseCase } from "../../application/use-cases/user/GoogleAuthUseCase.js";
import { VerifyOtpUseCase } from "../../application/use-cases/user/VerifyOtpUseCase.js";
import { ForgotPasswordUseCase } from "../../application/use-cases/user/ForgotPasswordUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/user/ResetPasswordUseCase .js"
import { ResendOtpUseCase } from "../../application/use-cases/user/ResendOtpUseCase.js";
import { DetectUserRoleUseCase } from "../../application/use-cases/user/DetectUserRoleUseCase.js";
import { verifyGoogleToken } from "../../infrastructure/stratergies/googleStratergy.js";



import { OtpPurpose } from "../../domain/enums/OtpPurpose.js";

export class AuthController {

  constructor(
    private readonly _detectUserRoleUseCase: DetectUserRoleUseCase,
    private readonly _loginUseCase: LoginUserUseCase,
    private readonly _forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly _verifyOtpUseCase: VerifyOtpUseCase,
    private readonly _resetPasswordUseCase: ResetPasswordUseCase,
    private readonly _registerUseCase: RegisterUseCase,
    private readonly _resendOtpUseCase: ResendOtpUseCase,
    private readonly _googleAuthUseCase: GoogleAuthUseCase,
  ) {}


  // ---------------- REGISTER ----------------
  async register(req: Request, res: Response, next: NextFunction) {
    try {

          const { name, email, password,phone, role } = req.body;
          console.log(req.body,"Req.body from signup")
    const result = await this._registerUseCase.execute({
      name,
      email,
      password,
    phone,
      role
    });
      return res.status(StatusCode.CREATED).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- LOGIN ----------------
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    const { repo, role, user } = await this._detectUserRoleUseCase.execute(email);
    const result = await this._loginUseCase.execute({
      password,
      repo,
      role,
      user,
    });

    return res.status(StatusCode.SUCCESS).json(result);
  } catch (err) {
    next(err);
  }
}


  // ---------------- GOOGLE LOGIN ----------------
async googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    console.log("\n========== 🟩 Google Login START ==========");

    const { token, role: frontendRole } = req.body;

    console.log("📨 Incoming Request:");
    console.log("   • frontendRole:", frontendRole);
    console.log("   • token provided:", !!token);

    if (!token) throw new Error("Google token required");

    // 1️⃣ Verify Google token
    console.log("\n🔐 Verifying Google token...");
    const googlePayload = await verifyGoogleToken(token);
    console.log("   ✔ Google token verified");
    console.log("   📧 Email:", googlePayload.email);
    console.log("   👤 Name:", googlePayload.name);
    console.log("   🔑 GoogleId:", googlePayload.googleId);

    const email = googlePayload.email;

    const googleUser = {
      name: googlePayload.name,
      email,
      googleId: googlePayload.googleId,
    };

    // 2️⃣ Detect user role + repo
    console.log("\n🔎 Running DetectUserRoleUseCase...");
    const { repo, role, user, isNewUser } =
      await this._detectUserRoleUseCase.execute(email);

    console.log("   ✔ Role detected:", role);
  
    console.log("   ✔ Existing user:", user ? "YES" : "NO");
    console.log("   ✔ New user:", isNewUser);

    // 3️⃣ Login / Signup logic
    console.log("\n🚀 Executing GoogleAuthUseCase...");
    const result = await this._googleAuthUseCase.execute({
      googleUser,
      repo,
      existingUser: user,
      frontendRole: isNewUser ? frontendRole : undefined,
    });

    console.log("   ✔ GoogleAuthUseCase completed");
    console.log("   🔑 Authenticated role:", role);
    console.log("   🟢 Login/Signup successful for:", email);

    console.log("========== 🟩 Google Login END ==========\n");

    res.status(StatusCode.SUCCESS).json(result);
  } catch (err) {
    console.log("❌ ERROR in Google Login:", err);
    console.log("========== 🟥 Google Login FAILED ==========\n");
    next(err);
  }
}






  // ---------------- RESEND OTP ----------------
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this._resendOtpUseCase.execute(req.body.email);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- FORGOT PASSWORD ----------------
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this._forgotPasswordUseCase.execute(req.body.email);
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- VERIFY OTP ----------------
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, otp, purpose } = req.body;  
        console.log(req.body,"req.body from verifyotp")
      const result = await this._verifyOtpUseCase.execute(
       email,
       otp,
        purpose
      );
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ---------------- RESET PASSWORD ----------------
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this._resetPasswordUseCase.execute(
        req.body.email,
        req.body.newPassword
      );
      return res.status(StatusCode.SUCCESS).json(result);
    } catch (err) {
      next(err);
    }
  }
}
