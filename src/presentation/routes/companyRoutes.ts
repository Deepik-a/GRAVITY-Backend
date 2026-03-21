import { Router } from "express";
import { upload } from "@/presentation/middlewares/MulterUpload";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { CompanyDocumentController } from "@/presentation/controllers/companyController/CompanyDocumentController";
import { CompanyProfileController } from "@/presentation/controllers/companyController/CompanyProfileController";
import { CompanyDashboardController } from "@/presentation/controllers/companyController/CompanyDashboardController";
import { AuthController } from "@/presentation/controllers/AuthController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";
import { ROUTES } from "@/shared/constants/routes";
const router = Router();

const docController = container.get<CompanyDocumentController>(TYPES.CompanyDocumentController);
const profileController = container.get<CompanyProfileController>(TYPES.CompanyProfileController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const companyAuth = container.get<SessionAuth>(TYPES.SessionAuth);
const authController = container.get<AuthController>(TYPES.AuthController);
const dashboardController = container.get<CompanyDashboardController>(TYPES.CompanyDashboardController);

router.post(ROUTES.AUTH.LOGOUT.replace("/company", ""), authController.logout.bind(authController));

router.post(
  ROUTES.COMPANY.VERIFICATION.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  upload.array("documents", 3),
  docController.upload.bind(docController)
);

router.get(
  ROUTES.COMPANY.ME.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.getProfile.bind(profileController)
);

router.get(
  ROUTES.COMPANY.PROFILE.replace("/company", "") + "/:companyId",
  profileController.getProfile.bind(profileController)
);

router.patch(
  ROUTES.COMPANY.PROFILE.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.updateProfile.bind(profileController)
);

router.post(
  ROUTES.COMPANY.PROFILE_IMAGE.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  upload.single("image"),
  profileController.uploadProfileImage.bind(profileController)
);

router.delete(
  ROUTES.COMPANY.PROFILE.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.deleteProfile.bind(profileController)
);

// Slot Management
router.get(
  ROUTES.COMPANY.BOOKINGS.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  slotController.getCompanyBookings.bind(slotController)
);
router.patch(
  ROUTES.COMPANY.BOOKING_UPDATE.replace("/company", "") + "/reschedule",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  slotController.rescheduleBooking.bind(slotController)
);
router.get(
  ROUTES.COMPANY.SLOTS_CONFIG.replace("/company", ""), 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.getConfig.bind(slotController)
);
router.patch(
  ROUTES.COMPANY.SLOTS_CONFIG.replace("/company", ""), 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.setConfig.bind(slotController)
);
router.delete(
  ROUTES.COMPANY.SLOTS_CONFIG.replace("/company", ""), 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.deleteConfig.bind(slotController)
);

import { RevenueController } from "@/presentation/controllers/RevenueController";
const revenueController = container.get<RevenueController>(TYPES.RevenueController);

router.get(
  ROUTES.COMPANY.WALLET.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  revenueController.getCompanyWallet.bind(revenueController)
);

router.get(
  ROUTES.COMPANY.DASHBOARD_STATS.replace("/company", ""),
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  dashboardController.getStats.bind(dashboardController)
);

export default router;

