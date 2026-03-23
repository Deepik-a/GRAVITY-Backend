import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { AuthController } from "@/presentation/controllers/AuthController"; // import class

import { ROUTES } from "@/shared/constants/routes";

const router = Router();

const authController = container.get<AuthController>(TYPES.AuthController);

router.post(ROUTES.AUTH.SIGNUP.replace("/auth", ""), authController.register.bind(authController));
router.post(ROUTES.AUTH.RESEND_OTP.replace("/auth", ""), authController.resendOtp.bind(authController));
router.post(ROUTES.AUTH.GOOGLE.replace("/auth", ""), authController.googleLogin.bind(authController));
router.post(ROUTES.AUTH.FORGOT_PASSWORD.replace("/auth", ""), authController.forgotPassword.bind(authController));
router.post(ROUTES.AUTH.VERIFY_OTP.replace("/auth", ""), authController.verifyOtp.bind(authController));
router.post(ROUTES.AUTH.RESET_PASSWORD.replace("/auth", ""), authController.resetPassword.bind(authController));
router.post(ROUTES.AUTH.LOGIN.replace("/auth", ""), authController.login.bind(authController));
router.post(ROUTES.AUTH.LOGOUT.replace("/auth", ""), authController.logout.bind(authController));

export default router;
