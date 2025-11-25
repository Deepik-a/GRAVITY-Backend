import { Router } from "express";

// ----------------------------------------------------
// Repositories
// ----------------------------------------------------
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";

// ----------------------------------------------------
// Services
// ----------------------------------------------------
import { JwtService } from "../../infrastructure/services/JWTService.js";

// ----------------------------------------------------
// Use Cases
// ----------------------------------------------------
import { GetUserProfileUseCase } from "../../application/use-cases/user/GetUserProfileUseCase.js";


// ----------------------------------------------------
// Controllers
// ----------------------------------------------------
import { ProfileController } from "../controllers/userController/ProfileController.js";

// ----------------------------------------------------
// Middlewares
// ----------------------------------------------------
import { Authenticate } from "../middlewares/authMiddleware.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { IJwtService } from "../../domain/services/IJWTService.js";

const router = Router();

// ----------------------------------------------------
// Instantiate Dependencies
// ----------------------------------------------------
const userRepo: IAuthRepository = new UserRepository();
const jwtService:IJwtService = new JwtService();

// ----------------------------------------------------
// Use Cases
// ----------------------------------------------------
const getProfileUseCase = new GetUserProfileUseCase(userRepo);


// ----------------------------------------------------
// Controller Instance
// ----------------------------------------------------
const profileController = new ProfileController(
  getProfileUseCase
);

// ----------------------------------------------------
// Routes
// ----------------------------------------------------
router.get(
  "/profile",
  profileController.getProfile.bind(profileController)
);



export default router;
