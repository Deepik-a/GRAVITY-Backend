import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { AdminLoginController } from "@/presentation/controllers/adminController/adminController"; // import class
import { AuthController } from "@/presentation/controllers/AuthController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware"; // import class/interface
import { ROUTES } from "@/shared/constants/routes";
const router = Router();

const adminController = container.get<AdminLoginController>(TYPES.AdminController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const adminAuth = container.get<SessionAuth>(TYPES.SessionAuth);
const authController = container.get<AuthController>(TYPES.AuthController);

router.post(ROUTES.AUTH.LOGOUT.replace("/admin", ""), authController.logout.bind(authController));

router.post(ROUTES.ADMIN.LOGIN.replace("/admin", ""), adminController.login.bind(adminController));
router.get(ROUTES.ADMIN.DASHBOARD_STATS.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), adminController.getDashboardStats.bind(adminController));
router.get(ROUTES.ADMIN.USER_MANAGEMENT.replace("/admin", ""), adminAuth.verify,adminAuth.authorize(["admin"]),adminController.getUsers.bind(adminController));
router.get(ROUTES.ADMIN.COMPANY_MANAGEMENT.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]),adminController.getCompanies.bind(adminController));
router.patch(ROUTES.ADMIN.VERIFY_COMPANY.replace("/admin", ""), adminAuth.verify,adminAuth.authorize(["admin"]),adminController.verifyCompany.bind(adminController));
router.patch(ROUTES.ADMIN.USERS_BLOCK.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleUserBlockStatus.bind(adminController));
router.patch(ROUTES.ADMIN.COMPANIES_BLOCK.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), adminController.toggleCompanyBlockStatus.bind(adminController));
router.get(ROUTES.ADMIN.USERS_SEARCH.replace("/admin", ""), adminAuth.verify,adminAuth.authorize(["admin"]),adminController.SearchUsers.bind(adminController));
router.get(ROUTES.ADMIN.COMPANIES_SEARCH.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), adminController.searchCompanies.bind(adminController));
router.get(ROUTES.COMPANY.BOOKINGS.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), slotController.getAllBookings.bind(slotController));

import { RevenueController } from "@/presentation/controllers/RevenueController";
const revenueController = container.get<RevenueController>(TYPES.RevenueController);

router.get(ROUTES.ADMIN.REVENUE.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), revenueController.getAdminRevenue.bind(revenueController));
router.post(ROUTES.ADMIN.PAYOUT.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), revenueController.initiatePayout.bind(revenueController));

import { TransactionController } from "@/presentation/controllers/adminController/TransactionController";
const transactionController = container.get<TransactionController>(TYPES.TransactionController);

router.get(ROUTES.ADMIN.TRANSACTIONS.replace("/admin", ""), adminAuth.verify, adminAuth.authorize(["admin"]), transactionController.getAllTransactions.bind(transactionController));

export default router;


