import type { Request, Response, NextFunction } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/user/SignupUserUsecase.js";
import { LoginUserUseCase } from "../../../application/use-cases/user/LoginUserUseCase.js";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";
import { ForgotPasswordUseCase } from "../../../application/use-cases/user/ForgotPasswordUseCase.js";
import { ResetPasswordUseCase } from "../../../application/use-cases/user/ResetPasswordUseCase .js";
import { OtpService } from "../../../application/providers/OTPService.js";
import { OtpPurpose } from "../../../domain/enums/OtpPurpose.js";

export class UserController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userRepository = new UserRepository();
      const registerUserUseCase = new RegisterUserUseCase(userRepository);
      const result = await registerUserUseCase.execute(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

 // ✅ LOGIN — set secure cookies after successful login
async login(req: Request, res: Response, next: NextFunction) {
  try {
    const userRepository = new UserRepository();
    const loginUserUseCase = new LoginUserUseCase(userRepository);
    const { user, accessToken, refreshToken } = await loginUserUseCase.execute(req.body);

    // Set tokens as cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",     // use "none" if frontend & backend are on different domains
      secure: false,       // true in production (HTTPS)
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ✅ VERIFY OTP — set cookies after OTP verification
async verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;
    const userRepository = new UserRepository();
    const verifyOtp = new VerifyOtpUseCase(userRepository);
    const result = await verifyOtp.execute(email, otp, OtpPurpose.SIGNUP);

    const { accessToken, refreshToken, user } = result;

    // Set cookies
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

    return res.status(200).json({
      message: "OTP verified and user authenticated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
}

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const userRepository = new UserRepository();
      const otpService = new OtpService();
      const forgotPasswordUseCase = new ForgotPasswordUseCase(userRepository, otpService);
      const result = await forgotPasswordUseCase.execute(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }


  async verifyForgotPasswordOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;
    const userRepository = new UserRepository();
    const verifyOtpUseCase = new VerifyOtpUseCase(userRepository);

    const result = await verifyOtpUseCase.execute(email, otp,OtpPurpose.FORGOT_PASSWORD);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, newPassword } = req.body;
    const userRepository = new UserRepository();
    const resetPasswordUseCase = new ResetPasswordUseCase(userRepository);
    const result = await resetPasswordUseCase.execute(email, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

}
