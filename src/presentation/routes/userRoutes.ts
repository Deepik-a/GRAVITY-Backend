import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ProfileController } from "@/presentation/controllers/userController/ProfileController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { CompanyController } from "@/presentation/controllers/userController/CompanyController";
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware"; 

const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const companyController = container.get<CompanyController>(TYPES.CompanyController);
const userAuth = container.get<SessionAuth>(TYPES.SessionAuth);


import { upload } from "@/presentation/middlewares/MulterUpload";

// Public route - Get all verified companies
router.get("/companies", companyController.getVerifiedCompanies.bind(companyController));


router.get(
  "/profile", 
  userAuth.verify, 
  userAuth.authorize(["user", "company"]), 
  profileController.getProfile.bind(profileController)
);

router.put(
  "/profile",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.updateProfile.bind(profileController)
);

router.post(
  "/profile/image",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  upload.single("image"),
  profileController.uploadProfileImage.bind(profileController)
);

router.patch(
  "/profile/field",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.deleteProfileField.bind(profileController)
);

// Slot Selection and Booking
router.get("/slots/available", slotController.getAvailableSlots.bind(slotController));
router.post("/slots/book", userAuth.verify, userAuth.authorize(["user"]), slotController.bookSlot.bind(slotController));
router.get("/bookings", userAuth.verify, userAuth.authorize(["user"]), slotController.getUserBookings.bind(slotController));

export default router;