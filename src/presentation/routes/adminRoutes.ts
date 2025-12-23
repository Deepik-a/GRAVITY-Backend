import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { AdminLoginController } from "@/presentation/controllers/adminController/AdminController"; // import class
import { SessionAuth } from "@/presentation/middlewares/authMiddleware"; // import class/interface

const router = Router();

const adminController = container.get<AdminLoginController>(TYPES.AdminController);
const adminAuth = container.get<SessionAuth>(TYPES.SessionAuth);

router.post("/login", adminController.login.bind(adminController));
router.get("/usermanagment", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.getUsers.bind(adminController));
router.get("/companies", adminAuth.verify, adminAuth.authorize(["admin"]),adminController.getCompanies.bind(adminController));
router.post("/verify-company", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.verifyCompany.bind(adminController));
router.patch("/users/block", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleUserBlockStatus.bind(adminController));
router.patch("/companies/block", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleCompanyBlockStatus.bind(adminController));

export default router;

