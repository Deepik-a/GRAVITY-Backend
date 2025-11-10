import { Router } from "express";
import { UserController } from "../controllers/userController/userController.js"
import { OtpController } from "../controllers/userController/OtpController.js";
import { GoogleAuthController } from "../controllers/userController/GoogleAuthController.js";
import { ProfileController } from "../controllers/userController/ProfileController.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { JwtService } from "../../infrastructure/services/JWTService.js";
import { Authenticate } from "../middlewares/authMiddleware.js";

const router = Router();
const userController = new UserController();
const otpController =new OtpController()
const googleAuthController=new GoogleAuthController()
const profilecontroller = new ProfileController();

class GetRepositoryDataAdapter {
  constructor(private repo: UserRepository) {}
  async OneDocumentById(userId: string) {
    return this.repo.findById(userId);
  }
}


const jwtService = new JwtService();
const repo = new UserRepository();
const getRepoAdapter = new GetRepositoryDataAdapter(repo);
const auth = new Authenticate(jwtService, getRepoAdapter);

// Routes

// 🔹 AUTHENTICATION
router.post("/signup", (req, res, next) => userController.register(req, res, next));
router.post("/login", (req, res, next) => userController.login(req, res, next));

// 🔹 OTP (Signup & Forgot Password)
router.post("/verify-otp", (req, res, next) => otpController.verifyOtp(req, res, next)); // signup
router.post("/verify-forgot-otp", (req, res, next) => otpController.verifyForgotPasswordOtp(req, res, next)); // forgot password
router.post("/resend-otp", otpController.resendOtp.bind(otpController));

// 🔹 PASSWORD RESET FLOW
router.post("/forgot-password", (req, res, next) => userController.forgotPassword(req, res, next));
router.post("/reset-password", (req, res, next) => userController.resetPassword(req, res, next));

// 🔹 Google Authentication FLOW
router.post("/google", (req, res,next) => googleAuthController.googleLogin(req, res,next));


//Get Profile
router.get("/profile", auth.verify, (req, res, next) => profilecontroller.getProfile(req, res, next));
router.put("/profile", auth.verify, (req, res, next) => profilecontroller.updateProfile(req, res, next));


export default router;


