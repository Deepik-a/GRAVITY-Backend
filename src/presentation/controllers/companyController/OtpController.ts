import { Request, Response, NextFunction } from "express";
import { RegisterUseCase } from "../../../application/use-cases/user/SignupUserUsecase.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";
import { ResendOtpUseCase } from "../../../application/use-cases/user/ResendOtpUseCase.js";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
import { OtpService } from "../../../application/providers/OTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";

export class OtpController {
  private userRepository: UserRepository;
  private otpService: OtpService;
  private role: "user" | "company" | "admin";

  constructor(role: "user" | "company" | "admin" = "user") {
    this.userRepository = new UserRepository();
    this.otpService = new OtpService();
    this.role = role; // set default role if none provided
  }

  // ✅ Signup — Send OTP
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const registerUserUseCase = new RegisterUseCase(this.userRepository, this.otpService, this.role);
      const result = await registerUserUseCase.execute({
        name,
        email,
        phone,
        password,
        role: this.role, // ✅ now works
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ✅ Signup — Verify OTP
  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP required" });
      }

      const verifyOtpUseCase = new VerifyOtpUseCase(this.userRepository);
      const result = await verifyOtpUseCase.execute(email, otp, OtpPurpose.SIGNUP);

      const { accessToken, refreshToken, user } = result;

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: "OTP verified and user authenticated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  // ✅ Forgot Password — Verify OTP
  async verifyForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP required" });
      }

      const verifyOtpUseCase = new VerifyOtpUseCase(this.userRepository);
      const result = await verifyOtpUseCase.execute(email, otp, OtpPurpose.FORGOT_PASSWORD);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ✅ Resend OTP
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const resendOtpUseCase = new ResendOtpUseCase();
      const result = await resendOtpUseCase.execute(email);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
