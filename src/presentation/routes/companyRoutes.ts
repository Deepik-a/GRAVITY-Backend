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
const router = Router();

const docController = container.get<CompanyDocumentController>(TYPES.CompanyDocumentController);
const profileController = container.get<CompanyProfileController>(TYPES.CompanyProfileController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const companyAuth = container.get<SessionAuth>(TYPES.SessionAuth);
const authController = container.get<AuthController>(TYPES.AuthController);
const dashboardController = container.get<CompanyDashboardController>(TYPES.CompanyDashboardController);

router.post("/logout", authController.logout.bind(authController));

router.post(
  "/upload-documents",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  upload.array("documents", 3),
  docController.upload.bind(docController)
);

router.get(
  "/me",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.getProfile.bind(profileController)
);

router.get(
  "/profile/:companyId",
  profileController.getProfile.bind(profileController)
);

router.put(
  "/profile",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.updateProfile.bind(profileController)
);

router.post(
  "/profile/image",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  upload.single("image"),
  profileController.uploadProfileImage.bind(profileController)
);

router.delete(
  "/profile",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  profileController.deleteProfile.bind(profileController)
);

// Slot Management
router.get(
  "/get-bookings",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  slotController.getCompanyBookings.bind(slotController)
);
router.patch(
  "/bookings/:bookingId/reschedule",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  slotController.rescheduleBooking.bind(slotController)
);
router.get(
  "/slots/config", 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.getConfig.bind(slotController)
);
router.post(
  "/slots/config", 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.setConfig.bind(slotController)
);
router.delete(
  "/slots/config", 
  companyAuth.verify, 
  companyAuth.authorize(["company"]), 
  slotController.deleteConfig.bind(slotController)
);

import { RevenueController } from "@/presentation/controllers/RevenueController";
const revenueController = container.get<RevenueController>(TYPES.RevenueController);

router.get(
  "/wallet",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  revenueController.getCompanyWallet.bind(revenueController)
);

router.get(
  "/dashboard/stats",
  companyAuth.verify,
  companyAuth.authorize(["company"]),
  dashboardController.getStats.bind(dashboardController)
);

export default router;

