import { Router } from "express";
import { container } from "../../infrastructure/DI/inversify.config";
import { TYPES } from "../../infrastructure/DI/types.js";
import { AdminLoginController } from "../controllers/adminController/adminController.js"; // import class
import { SessionAuth } from "../middlewares/authMiddleware.js"; // import class/interface

const router = Router();

const adminController = container.get<AdminLoginController>(TYPES.AdminController);
const adminAuth = container.get<SessionAuth>(TYPES.SessionAuth);

router.post("/login", adminController.login.bind(adminController));
router.get("/usermanagment", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.getUsers.bind(adminController));
router.get("/companies", adminAuth.verify, adminAuth.authorize(["admin"]),adminController.getCompanies.bind(adminController));
router.post("/verify-company", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.verifyCompany.bind(adminController));

export default router;

