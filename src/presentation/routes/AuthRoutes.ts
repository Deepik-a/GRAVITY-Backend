import { Router } from "express";

// Repositories
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";

// Services
import { OtpService } from "../../infrastructure/services/OTPService.js";
import { IOtpService } from "../../domain/services/IOTPService.js";
import { JwtService } from "../../infrastructure/services/JWTService.js";
import { IJwtService } from "../../domain/services/IJWTService.js";

// Use Cases
import { ForgotPasswordUseCase } from "../../application/use-cases/user/ForgotPasswordUseCase.js";
import { VerifyOtpUseCase } from "../../application/use-cases/user/VerifyOtpUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/user/ResetPasswordUseCase .js";
import { RegisterUseCase } from "../../application/use-cases/user/SignupUserUsecase.js";
import { ResendOtpUseCase } from "../../application/use-cases/user/ResendOtpUseCase.js";
import { GoogleAuthUseCase } from "../../application/use-cases/user/GoogleAuthUseCase.js";
import { DetectUserRoleUseCase } from "../../application/use-cases/user/DetectUserRoleUseCase.js";
import { LoginUserUseCase } from "../../application/use-cases/user/LoginUserUseCase.js";
import { AdminLoginUseCase } from "../../application/use-cases/admin/AdminLoginUseCase.js";

// Controller
import { AuthController } from "../controllers/AuthController.js";

// Domain interface
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { AdminRepository } from "../../infrastructure/repositories/AdminRepository.js";
import { IAdminRepository } from "../../domain/repositories/IAdminRepository.js";

const router = Router();

// ----------------------------------------------------
// Instantiate Dependencies
// ----------------------------------------------------
const userRepo: IAuthRepository = new UserRepository();//OCP
const companyRepo: IAuthRepository = new CompanyRepository();//LSP


const otpService:IOtpService = new OtpService();//ISP
const jwtService: IJwtService = new JwtService();


// ----------------------------------------------------
// Use Cases (Correct DI)
// ----------------------------------------------------
const detectUserRoleUseCase = new DetectUserRoleUseCase(
  userRepo,
  companyRepo,
);

const loginUseCase = new LoginUserUseCase(
  jwtService
);


const forgotPasswordUseCase = new ForgotPasswordUseCase(
  userRepo,
  companyRepo,
  otpService
);

const verifyOtpUseCase = new VerifyOtpUseCase(
  userRepo,
  companyRepo,
   otpService
);

const resetPasswordUseCase = new ResetPasswordUseCase(
  userRepo,
  companyRepo
);

const registerUseCase = new RegisterUseCase(
  userRepo,
  companyRepo,
  otpService
);

const resendOtpUseCase = new ResendOtpUseCase( otpService, userRepo,
  companyRepo,
  );

const googleAuthUseCase = new GoogleAuthUseCase(  userRepo,
  companyRepo,jwtService);


// ----------------------------------------------------
// Controller Injection
// ----------------------------------------------------
const authController = new AuthController(
  detectUserRoleUseCase,
  loginUseCase,
  forgotPasswordUseCase,
  verifyOtpUseCase,
  resetPasswordUseCase,
  registerUseCase,
  resendOtpUseCase,
  googleAuthUseCase,
);

// ----------------------------------------------------
// Routes
// ----------------------------------------------------
router.post("/signup", authController.register.bind(authController));
router.post("/resend-otp", authController.resendOtp.bind(authController));
router.post("/google", authController.googleLogin.bind(authController));
router.post("/forgot-password", authController.forgotPassword.bind(authController));
router.post("/verify-otp", authController.verifyOtp.bind(authController));
router.post("/reset-password", authController.resetPassword.bind(authController));
router.post("/login", authController.login.bind(authController));

export default router;
