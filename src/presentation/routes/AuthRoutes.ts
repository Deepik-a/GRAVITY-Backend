import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { AuthController } from "@/presentation/controllers/AuthController"; // import class

const router = Router();

const authController = container.get<AuthController>(TYPES.AuthController);

router.post("/signup", authController.register.bind(authController));
router.post("/resend-otp", authController.resendOtp.bind(authController));
router.post("/google", authController.googleLogin.bind(authController));
router.post("/forgot-password", authController.forgotPassword.bind(authController));
router.post("/verify-otp", authController.verifyOtp.bind(authController));
router.post("/reset-password", authController.resetPassword.bind(authController));
router.post("/login", authController.login.bind(authController));

export default router;
