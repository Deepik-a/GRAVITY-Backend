import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "../../../application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { StatusCode } from "../../../domain/enums/StatusCode.js";
import { injectable, inject } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
@injectable()
export class ProfileController {
  constructor(
   @inject(TYPES.GetUserProfileUseCase) private readonly getProfileUseCase: IGetUserProfileUseCase,
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

