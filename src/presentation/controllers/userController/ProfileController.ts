import { Request, Response, NextFunction } from "express";
import { IGetUserProfileUseCase } from "@/application/interfaces/use-cases/user/IGetUserProfileUseCase";
import { ProfileResponseDTO } from "@/application/dtos/ProfileResponseDTO";
import { StatusCode } from "@/domain/enums/StatusCode";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GetUserProfileRequestDto, UpdateUserProfileRequestDto } from "@/application/dtos/user/ProfileRequestDto";
import { AuthenticatedUser } from "@/types/auth";
import { IUpdateUserProfileUseCase } from "@/application/interfaces/use-cases/user/IUpdateUserProfileUseCase";
import { IStorageService } from "@/domain/services/IStorageService";


@injectable()
export class ProfileController {
  constructor(
   @inject(TYPES.GetUserProfileUseCase) private readonly _getProfileUseCase: IGetUserProfileUseCase,
   @inject(TYPES.UpdateUserProfileUseCase) private readonly _updateProfileUseCase: IUpdateUserProfileUseCase,
   @inject(TYPES.StorageService) private readonly _storageService: IStorageService
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) {
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: "Unauthorized: No user ID found" });
      }

      const requestDto: GetUserProfileRequestDto = { id: user.id };
      const profile: ProfileResponseDTO = await this._getProfileUseCase.execute(requestDto);

      return res.status(StatusCode.SUCCESS).json({
        message: "Profile fetched successfully",
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });

      const dto: UpdateUserProfileRequestDto = {
        id: user.id,
        ...req.body
      };

      const profile = await this._updateProfileUseCase.execute(dto);
      return res.status(StatusCode.SUCCESS).json({ message: "Profile updated successfully", profile });
    } catch (error) {
      next(error);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });

      if (!req.file) return res.status(StatusCode.BAD_REQUEST).json({ message: "No image file provided" });

      const imageUrl = await this._storageService.uploadFile(req.file);

      const dto: UpdateUserProfileRequestDto = {
        id: user.id,
        profileImage: imageUrl
      };

      await this._updateProfileUseCase.execute(dto);

      return res.status(StatusCode.SUCCESS).json({ message: "Profile image uploaded", url: imageUrl });
    } catch (error) {
      next(error);
    }
  }

  async deleteProfileField(req: Request, res: Response, next: NextFunction) {
    try {
       const user = req.user as AuthenticatedUser | undefined;
       if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
 
       const { field } = req.body;
       if (!field) return res.status(StatusCode.BAD_REQUEST).json({ message: "Field name required" });

       // Prevent deleting critical fields
       if (["name", "email", "id"].includes(field)) {
           return res.status(StatusCode.BAD_REQUEST).json({ message: "Cannot delete this field" });
       }

       const dto: UpdateUserProfileRequestDto = {
           id: user.id,
           [field]: "" // Set to empty string or null depending on backend logic. Usually "" is safer for partial updates to clear.
       };
       
       // We should only allow 'phone', 'location', 'bio', 'profileImage'. 
       
       await this._updateProfileUseCase.execute(dto as UpdateUserProfileRequestDto);
 
       return res.status(StatusCode.SUCCESS).json({ message: "Field deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

