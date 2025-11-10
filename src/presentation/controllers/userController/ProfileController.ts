import { Request, Response, NextFunction } from "express";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
import { GetUserProfileUseCase } from "../../../application/use-cases/user/GetUserProfileUseCase.js";
import { UpdateUserProfileUseCase } from "../../../application/use-cases/user/UpdateProfileUseCase.js";

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    console.log("🎯 [Controller] req.user received from middleware:", (req as any).user);
    try {
      const user = (req as any).user;
      if (!user?.id) {
        console.error("❌ [Controller] Missing user.id in req.user");
        return res.status(401).json({ message: "Unauthorized: No user ID found" });
      }

      const userRepository = new UserRepository();
      const getProfileUseCase = new GetUserProfileUseCase(userRepository);
      const profile = await getProfileUseCase.execute(user.id);

      return res.status(200).json({
        message: "Profile fetched successfully",
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ message: "Unauthorized: No user ID found" });
      }

      const userRepository = new UserRepository();
      const updateProfileUseCase = new UpdateUserProfileUseCase(userRepository);

      const result = await updateProfileUseCase.execute({
        userId: user.id,
        ...req.body,
      });

      return res.status(200).json({
        message: "Profile updated successfully",
        profile: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
