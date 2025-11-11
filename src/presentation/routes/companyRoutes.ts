// import { Router } from "express";
// //import { UserController } from "../controllers/userController/userController.js"
// //import { OtpController } from "../controllers/userController/OtpController.js";
// //import { GoogleAuthController } from "../controllers/userController/GoogleAuthController.js";
// import { AuthController } from "../controllers/AuthController.js";
// import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";
// import { JwtService } from "../../infrastructure/services/JWTService.js";
// import { OtpService } from "../../application/providers/OTPService.js";
// import { Authenticate } from "../middlewares/authMiddleware.js";

// const router = Router();

// // ✅ COMPANY ROUTES
// const jwtService = new JwtService();
// const otpService = new OtpService();
// const companyRepository = new CompanyRepository();
// const companyController = new AuthController(companyRepository, jwtService, otpService, "company");



// // 🔹 AUTHENTICATION
// router.post("/signup", (req, res, next) => companyController.register(req, res, next));
// router.post("/login", (req, res, next) => companyController.login(req, res, next));



// export default router;
// src/interfaces/routes/companyRoutes.ts
import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { CompanyController } from "../controllers/companyController/CompanyController.js";
import { OtpController } from "../controllers/companyController/OtpController.js";
import { JwtService } from "../../infrastructure/services/JWTService.js";
import { OtpService } from "../../application/providers/OTPService.js";
import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";
import { Authenticate } from "../middlewares/authMiddleware.js";

const router = Router();
const jwtService = new JwtService();
const otpService = new OtpService();

// ------------------------ REPOSITORIES & CONTROLLERS ------------------------
const companyRepository = new CompanyRepository();
const authController = new AuthController( jwtService, otpService,"company");
const companyController = new CompanyController(jwtService, "company");
const otpController = new OtpController();
const auth = new Authenticate(jwtService, {
  OneDocumentById: async (id: string) => companyRepository.findById(id),
});

// ------------------------ AUTH (Signup/Login) ------------------------
router.post("/signup", (req, res, next) => {
  console.log("📩 [ROUTE] /api/company/signup hit");
  console.log("📦 Request body:", req.body);
  authController.register(req, res, next);
});

router.post("/login", (req, res, next) => authController.login(req, res, next));

// ------------------------ OTP ------------------------
router.post("/verify-otp", (req, res, next) => companyController.verifyOtp(req, res, next));
router.post("/verify-forgot-otp", (req, res, next) => companyController.verifyForgotPasswordOtp(req, res, next));
router.post("/resend-otp", (req, res, next) => companyController.resendOtp(req, res, next));

// ------------------------ PASSWORD RESET ------------------------
router.post("/forgot-password", (req, res, next) => companyController.forgotPassword(req, res, next));
router.post("/reset-password", (req, res, next) => companyController.resetPassword(req, res, next));

// ------------------------ GOOGLE AUTH ------------------------
router.post("/google", (req, res, next) => companyController.googleLogin(req, res, next));



export default router;
