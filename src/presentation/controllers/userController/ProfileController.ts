import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "@/application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { StatusCode } from "@/domain/enums/StatusCode";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";
import { AuthenticatedUser } from "@/types/auth";


@injectable()
export class ProfileController {
  constructor(
   @inject(TYPES.GetUserProfileUseCase) private readonly _getProfileUseCase: IGetUserProfileUseCase,
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) {
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: "Unauthorized: No user ID found" });
      }

      const requestDto: GetUserProfileRequestDto = { userId: user.id };
      const profile: ProfileResponseDTO = await this._getProfileUseCase.execute(requestDto);

      return res.status(StatusCode.SUCCESS).json({
        message: "Profile fetched successfully",
        profile,
      });
    } catch (error) {
      next(error);
    }
  }
}

