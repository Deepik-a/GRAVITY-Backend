import { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/user/SignupUserUsecase.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";
import { ResendOtpUseCase } from "../../../application/use-cases/user/ResendOtpUseCase.js";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";

export class OtpController {
  // ✅ Signup — Send OTP
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, password } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const userRepository = new UserRepository();
      const registerUserUseCase = new RegisterUserUseCase(userRepository);
      const result = await registerUserUseCase.execute({ name, email, phone, password });

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

      const userRepository = new UserRepository();
      const verifyOtp = new VerifyOtpUseCase(userRepository);
      const result = await verifyOtp.execute(email, otp, OtpPurpose.SIGNUP);

      const { accessToken, refreshToken, user } = result;

      // ✅ Set secure cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "lax",      // use 'none' if frontend & backend are on different domains
        secure: false,         // true in production with HTTPS
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
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

      const userRepository = new UserRepository();
      const verifyOtp = new VerifyOtpUseCase(userRepository);
      const result = await verifyOtp.execute(email, otp, OtpPurpose.FORGOT_PASSWORD);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // ✅ Resend OTP
  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      console.log("📩 Resend OTP Controller triggered for:", email);

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const resendOtpUseCase = new ResendOtpUseCase();
      const result = await resendOtpUseCase.execute(email);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
