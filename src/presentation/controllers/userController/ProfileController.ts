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
import { IToggleFavouriteUseCase } from "@/application/interfaces/use-cases/user/IToggleFavouriteUseCase";
import { IGetFavouritesUseCase } from "@/application/interfaces/use-cases/user/IGetFavouritesUseCase";
import { IChangePasswordUseCase } from "@/application/interfaces/use-cases/user/IChangePasswordUseCase";


@injectable()
export class ProfileController {
  constructor(
   @inject(TYPES.GetUserProfileUseCase) private readonly _getProfileUseCase: IGetUserProfileUseCase,
   @inject(TYPES.UpdateUserProfileUseCase) private readonly _updateProfileUseCase: IUpdateUserProfileUseCase,
   @inject(TYPES.StorageService) private readonly _storageService: IStorageService,
   @inject(TYPES.ToggleFavouriteUseCase) private readonly _toggleFavouriteUseCase: IToggleFavouriteUseCase,
   @inject(TYPES.GetFavouritesUseCase) private readonly _getFavouritesUseCase: IGetFavouritesUseCase,
   @inject(TYPES.ChangePasswordUseCase) private readonly _changePasswordUseCase: IChangePasswordUseCase
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) {
        return res
          .status(StatusCode.UNAUTHORIZED)
          .json({ message: "Unauthorized: No user ID found" });
      }

      const requestDto: GetUserProfileRequestDto = { 
        id: user.id,
        role: user.role
      };
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

      const key = await this._storageService.uploadFile(req.file);

      const dto: UpdateUserProfileRequestDto = {
        id: user.id,
        profileImage: key
      };

      await this._updateProfileUseCase.execute(dto);

      const signedUrl = await this._storageService.getSignedUrl(key);
      return res.status(StatusCode.SUCCESS).json({ message: "Profile image uploaded", url: signedUrl });
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


  async toggleFavourite(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });

      const { companyId } = req.body;
      
      if (user.role === "company") {
        return res.status(StatusCode.BAD_REQUEST).json({ message: "Companies cannot add favourites" });
      }

      const favourites = await this._toggleFavouriteUseCase.execute(user.id, companyId);
      
      return res.status(StatusCode.SUCCESS).json({ message: "Favourites updated", favourites });
    } catch (error) {
      next(error);
    }
  }

  async getFavourites(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });

      if (user.role === "company") {
        return res.status(StatusCode.SUCCESS).json({ message: "Companies do not have favourites", favourites: [] });
      }

      const favourites = await this._getFavouritesUseCase.execute(user.id);
      return res.status(StatusCode.SUCCESS).json({ message: "Favourites fetched", favourites });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user as AuthenticatedUser | undefined;
      if (!user?.id) return res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });

      const { oldPassword, newPassword } = req.body;
      await this._changePasswordUseCase.execute(user.id, { oldPassword, newPassword });
      
      return res.status(StatusCode.SUCCESS).json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  }
}

