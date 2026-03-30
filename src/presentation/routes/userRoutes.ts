import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ProfileController } from "@/presentation/controllers/userController/ProfileController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { CompanyController } from "@/presentation/controllers/userController/CompanyController";
import { AuthController } from "@/presentation/controllers/AuthController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware"; 
import { ROUTES } from "@/shared/constants/routes";
const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const slotController = container.get<SlotController>(TYPES.SlotController);
const companyController = container.get<CompanyController>(TYPES.CompanyController);
const userAuth = container.get<SessionAuth>(TYPES.SessionAuth);
const authController = container.get<AuthController>(TYPES.AuthController);

import { upload } from "@/presentation/middlewares/MulterUpload";

// Public route - Get all verified companies
router.get(ROUTES.USER.COMPANIES.replace("/user", ""), companyController.getVerifiedCompanies.bind(companyController));
router.get(ROUTES.USER.COMPANY_PROFILE.replace("/user", ""), companyController.getProfile.bind(companyController));
router.get(ROUTES.USER.STATS.replace("/user", ""), companyController.getPublicStats.bind(companyController));

router.post(ROUTES.AUTH.LOGOUT.replace("/user", ""), authController.logout.bind(authController));


router.get(
  ROUTES.USER.PROFILE.replace("/user", ""), 
  userAuth.verify, 
  userAuth.authorize(["user", "company"]), 
  profileController.getProfile.bind(profileController)
);

router.patch(
  ROUTES.USER.PROFILE.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.updateProfile.bind(profileController)
);

router.post(
  ROUTES.USER.PROFILE_IMAGE.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  upload.single("image"),
  profileController.uploadProfileImage.bind(profileController)
);

router.patch(
  ROUTES.USER.PROFILE_FIELD.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.deleteProfileField.bind(profileController)
);

router.get(
  ROUTES.USER.FAVOURITES.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.getFavourites.bind(profileController)
);

router.post(
  ROUTES.USER.FAVOURITES.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.toggleFavourite.bind(profileController)
);

router.patch(
  ROUTES.USER.PROFILE_PASSWORD.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user", "company"]),
  profileController.changePassword.bind(profileController)
);

// Slot Selection and Booking
router.get(ROUTES.USER.SLOTS_AVAILABLE.replace("/user", ""), userAuth.verify, userAuth.authorize(["user", "company"]), slotController.getAvailableSlots.bind(slotController));
router.get(ROUTES.USER.SLOTS_CONFIG.replace("/user", ""), userAuth.verify, userAuth.authorize(["user", "company"]), slotController.getCompanyConfig.bind(slotController));
router.post(ROUTES.USER.BOOK_SLOT.replace("/user", ""), userAuth.verify, userAuth.authorize(["user", "company"]), slotController.bookSlot.bind(slotController));
router.get(ROUTES.USER.BOOKINGS.replace("/user", ""), userAuth.verify, userAuth.authorize(["user", "company"]), slotController.getUserBookings.bind(slotController));
router.patch(ROUTES.USER.BOOKING_COMPLETE.replace("/user", ""), userAuth.verify, userAuth.authorize(["user", "company"]), slotController.completeBooking.bind(slotController));

import { ReviewController } from "@/presentation/controllers/ReviewController";

const reviewController = container.get<ReviewController>(TYPES.ReviewController);

// ... existing routes

// Reviews
router.post(
  ROUTES.USER.REVIEWS.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user"]),
  reviewController.submitReview.bind(reviewController)
);

// Alternative POST route for RESTful consistency (used by frontend)
router.post(
  ROUTES.USER.COMPANY_REVIEWS.replace("/user", ""),
  userAuth.verify,
  userAuth.authorize(["user"]),
  reviewController.submitReview.bind(reviewController)
);

router.get(
  ROUTES.USER.COMPANY_REVIEWS.replace("/user", ""),
  // Public or User? Let's generic public access if needed, or userAuth
  // userAuth.verify, 
  // userAuth.authorize(["user", "company"]), // Optional: Authenticated only?
  reviewController.getCompanyReviews.bind(reviewController)
);

export default router;