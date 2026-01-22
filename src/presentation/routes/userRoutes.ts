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

router.get(
  "/profile/favourites",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.getFavourites.bind(profileController)
);

router.post(
  "/profile/favourites",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.toggleFavourite.bind(profileController)
);

router.put(
  "/profile/password",
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.changePassword.bind(profileController)
);

// Slot Selection and Booking
router.get("/slots/available", userAuth.verify, userAuth.authorize(["user", "company"]), slotController.getAvailableSlots.bind(slotController));
router.post("/slots/book", userAuth.verify, userAuth.authorize(["user", "company"]), slotController.bookSlot.bind(slotController));
router.get("/bookings", userAuth.verify, userAuth.authorize(["user", "company"]), slotController.getUserBookings.bind(slotController));
router.patch("/bookings/:bookingId/complete", userAuth.verify, userAuth.authorize(["user", "company"]), slotController.completeBooking.bind(slotController));

import { ReviewController } from "@/presentation/controllers/ReviewController";

const reviewController = container.get<ReviewController>(TYPES.ReviewController);

// ... existing routes

// Reviews
router.post(
  "/reviews",
  userAuth.verify,
  userAuth.authorize(["user"]),
  reviewController.submitReview.bind(reviewController)
);

router.get(
  "/companies/:companyId/reviews",
  // Public or User? Let's generic public access if needed, or userAuth
  // userAuth.verify, 
  // userAuth.authorize(["user", "company"]), // Optional: Authenticated only?
  reviewController.getCompanyReviews.bind(reviewController)
);

export default router;