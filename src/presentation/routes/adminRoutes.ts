import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { AdminLoginController } from "@/presentation/controllers/adminController/AdminController"; // import class
import { AuthController } from "@/presentation/controllers/AuthController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware"; // import class/interface

const router = Router();

const adminController = container.get<AdminLoginController>(TYPES.AdminController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const adminAuth = container.get<SessionAuth>(TYPES.SessionAuth);
const authController = container.get<AuthController>(TYPES.AuthController);

router.post("/logout", authController.logout.bind(authController));

router.post("/login", adminController.login.bind(adminController));
router.get("/dashboard-stats", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.getDashboardStats.bind(adminController));
router.get("/usermanagment", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.getUsers.bind(adminController));
router.get("/companies", adminAuth.verify, adminAuth.authorize(["admin"]),adminController.getCompanies.bind(adminController));
router.post("/verify-company", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.verifyCompany.bind(adminController));
router.patch("/users/block", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleUserBlockStatus.bind(adminController));
router.patch("/companies/block", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleCompanyBlockStatus.bind(adminController));
router.get("/users-search", adminAuth.verify,adminAuth.authorize(["admin"]),adminController.SearchUsers.bind(adminController));
router.get("/companies-search", adminAuth.verify, adminAuth.authorize(["admin"]), adminController.searchCompanies.bind(adminController));
router.get("/bookings", adminAuth.verify, adminAuth.authorize(["admin"]), slotController.getAllBookings.bind(slotController));

import { RevenueController } from "@/presentation/controllers/RevenueController";
const revenueController = container.get<RevenueController>(TYPES.RevenueController);

router.get("/revenue", adminAuth.verify, adminAuth.authorize(["admin"]), revenueController.getAdminRevenue.bind(revenueController));
router.post("/payout", adminAuth.verify, adminAuth.authorize(["admin"]), revenueController.initiatePayout.bind(revenueController));

import { TransactionController } from "@/presentation/controllers/adminController/TransactionController";
const transactionController = container.get<TransactionController>(TYPES.TransactionController);

router.get("/transactions", adminAuth.verify, adminAuth.authorize(["admin"]), transactionController.getAllTransactions.bind(transactionController));

export default router;


