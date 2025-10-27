import { Router } from "express";
import { UserController } from "../controllers/userController/userController.js"

const router = Router();
const userController = new UserController();


// Routes

router.post("/login", userController.login);
router.post("/signup", (req, res) => userController.register(req, res));
router.post("/verify-otp", (req, res) => userController.verifyOtp(req, res));

export default router;
