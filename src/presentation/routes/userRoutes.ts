import { Router } from "express";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { ProfileController } from "@/presentation/controllers/userController/ProfileController";
import { SessionAuth } from "@/presentation/middlewares/authMiddleware"; 

const router = Router();
const profileController = container.get<ProfileController>(TYPES.ProfileController);
const userAuth = container.get<SessionAuth>(TYPES.SessionAuth);


router.get(
  "/profile", 
  userAuth.verify, 
  userAuth.authorize(["user", "company"]), 
  profileController.getProfile.bind(profileController)
);

export default router;