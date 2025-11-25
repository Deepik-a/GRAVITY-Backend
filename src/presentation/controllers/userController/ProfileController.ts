import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "../../../application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { StatusCode } from "../../../domain/enums/StatusCode.js";

export class ProfileController {
  constructor(
    private readonly getProfileUseCase: IGetUserProfileUseCase,
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      if (!user?.id) {
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: "Unauthorized: No user ID found" });
      }

      const profile = await this.getProfileUseCase.execute(user.id);

      return res.status(StatusCode.SUCCESS).json({
        message: "Profile fetched successfully",
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

}

