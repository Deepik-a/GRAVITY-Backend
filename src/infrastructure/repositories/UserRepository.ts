import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import UserModel from "@/infrastructure/database/models/UserModel";
import SubscriptionPlanModel from "@/infrastructure/database/models/SubscriptionPlanModel";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { UserSignUp, GoogleSignUp, UserProfile } from "@/domain/entities/User";
import { ICompany } from "@/domain/entities/Company";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { IStorageService } from "@/domain/services/IStorageService";
import { ILogger } from "@/domain/services/ILogger";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class UserRepository
  extends BaseRepository<any>
  implements IAuthRepository, IUserRepository
{
  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {
    super(UserModel);
    super(SubscriptionPlanModel);
  }

  /* --------------------------------------------------
      RESOLVE URLS HELPERS
    -------------------------------------------------- */
  private async _resolveUserImageUrl(url?: string): Promise<string | undefined> {
    if (!url || url.startsWith("http") || url.startsWith("data:")) return url;
    try {
      return await this._s3Service.getSignedUrl(url);
    } catch (err) {
      this._logger.error(`❌ Failed to resolve user profile image: ${url}`, { error: err });
      return url;
    }
  }

  private async _resolveCompanyProfileUrls(profile: Record<string, any> | null): Promise<Record<string, any> | null> {
    if (!profile) return null;

    // Resolve brand identity
    if (profile.brandIdentity) {
      const keys = ["logo", "banner1", "banner2", "profilePicture"];
      for (const key of keys) {
        if (profile.brandIdentity[key] && !profile.brandIdentity[key].startsWith("http")) {
          try {
            profile.brandIdentity[key] = await this._s3Service.getSignedUrl(profile.brandIdentity[key]);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve company ${key}`, { error: err });
          }
        }
      }
    }
    return profile;
  }

 
// 🟩 Create local user
async create(user: UserSignUp): Promise<UserSignUp> {
  const created = await this.model.create({  //passing database fields
    name: user.name,
    email: user.email,
     password: user.password,
        role: user.role,
    provider: "local",
    phone: user.phone,
    status: user.status ?? "pending",
  });

  return new UserSignUp(
    new UniqueEntityID(created._id), // ✅ MongoDB ObjectId → UniqueEntityID
    created.name,
    created.email,
    created.password,
    created.role as "user" | "company" ,
    created.provider,
        created.phone,
    created.status,
    created.documentStatus,
    created.rejectionReason,
    created.isBlocked
  );
}


  // 🟩 Find user (for login/forgot password)
// 🟩 Find user (for login/forgot password)
async findByEmail(email: string): Promise<UserSignUp | null> {
  const found = await this.model.findOne({ email, provider: "local" }).exec();
  if (!found) return null;

  return new UserSignUp(
    new UniqueEntityID(found._id), // ✅ consistent naming
    found.name,
    found.email,
    found.password,
    found.role as "user" | "company" ,
    found.provider,
   found.phone ?? "",
    found.status,
    found.documentStatus,
    found.rejectionReason,
    found.isBlocked
  );
}



  // 🟦 Update password
  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const result = await this.model.updateOne(
      { email, provider: "local" },
      { $set: { password: hashedPassword } }
    );
    if (result.matchedCount === 0) throw new AppError("User not found", StatusCode.NOT_FOUND);
  }

  // 🟨 Google Users
  async createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp> {
    const created = await this.model.create({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
            role: user.role,
      provider: "google",
      status: user.status,
    });
    return new GoogleSignUp(
      created.name,
      created.email,
      created.googleId ? created.googleId : "",
      user.role,
      user.provider,
      user.status,
      new UniqueEntityID(created._id.toString()),
      created.documentStatus,
      created.rejectionReason,
      created.isBlocked
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ googleId, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(
      record.name,
      record.email,
      record.googleId ? record.googleId : "",
      record.role,
      record.provider,
      record.status,
      new UniqueEntityID(record._id.toString()),
      record.documentStatus,
      record.rejectionReason,
      record.isBlocked
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ email, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(
      record.name,
      record.email,
      record.googleId ? record.googleId : "",
      record.role,
      record.provider,
      record.status,
      new UniqueEntityID(record._id.toString()),
      record.documentStatus,
      record.rejectionReason,
      record.isBlocked
    );
  }

  // 🟩 Get profile
  async findById(userId: string): Promise<UserProfile | null> {
    const user = Types.ObjectId.isValid(userId)
      ? await this.model.findById(userId).exec()
      : await this.model.findOne({ googleId: userId }).exec();

    if (!user) return null;
    
    // Debug logging for block status investigation - REMOVED

    return new UserProfile(           //here infrastructure layer is lower layer/inner layer it can depend on domain layer
      new UniqueEntityID(user._id.toString()),
      user.name,
      user.email,
      await this._resolveUserImageUrl(user.profileImage ?? undefined),
      user.phone ?? undefined,
      user.location ?? undefined,
      user.bio ?? undefined,
      user.isBlocked ?? false,
      user.role
    );
  }

  // 🟦 Update profilea
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = Types.ObjectId.isValid(userId)
      ? await this.model.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec()
      : await this.model.findOneAndUpdate({ googleId: userId }, { $set: updates }, { new: true }).exec();

    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID(updated._id.toString()),
      updated.name,
      updated.email,
      await this._resolveUserImageUrl(updated.profileImage ?? undefined),
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined,
      updated.isBlocked,
      updated.role
    );
  }

  async getAllUsers(): Promise<UserProfile[]> {
  console.log("Fetching all users with booking counts");

  const users = await UserModel.aggregate([
    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "userId",
        as: "bookings"
      }
    },
    {
      $addFields: {
        bookingCount: { $size: "$bookings" }
      }
    }
  ]);

  const subscriptionName= await SubscriptionPlanModel.

  console.log("users in repo", users);

  // Generate signed URLs for profile images
  return await Promise.all(
    users.map(async (user) => {
      let profileImageUrl: string | undefined = undefined;

      // if profile image exists, generate signed URL
      if (user.profileImage) {
          profileImageUrl = await this._s3Service.getSignedUrl(user.profileImage);
      }
  

      return new UserProfile(
        new UniqueEntityID(user._id.toString()),
        user.name,
        user.email,
        profileImageUrl,
        user.phone ?? undefined,
        user.location ?? undefined,
        user.bio ?? undefined,
        user.isBlocked ?? false,
        user.role ?? undefined,
        user.bookingCount ?? 0
      );
    })
  );
}

  async updateBlockStatus(userId: string, isBlocked: boolean): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(
      userId,
      { $set: { isBlocked } },
      { new: true }
    ).exec();

    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID(updated._id.toString()),
      updated.name,
      updated.email,
      await this._resolveUserImageUrl(updated.profileImage ?? undefined),
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined,
      updated.isBlocked,
      updated.role
    );
  }

  // Toggle Favourite
  async toggleFavourite(userId: string, companyId: string): Promise<string[]> {
    const user = await this.model.findById(userId);
    if (!user) throw new AppError("User not found", StatusCode.NOT_FOUND);

    const isFavourite = user.favourites.some((id: Types.ObjectId) => id.toString() === companyId);
    
    if (isFavourite) {
      await this.model.findByIdAndUpdate(userId, { $pull: { favourites: companyId } });
    } else {
      await this.model.findByIdAndUpdate(userId, { $addToSet: { favourites: companyId } });
    }

    const updatedUser = await this.model.findById(userId).select("favourites");
    return updatedUser?.favourites.map((id: Types.ObjectId) => id.toString()) || [];
  }

  // Get Favourites
  async getFavourites(userId: string): Promise<ICompany[]> {
    const user = await this.model.findById(userId).populate("favourites").exec();
    if (!user) throw new AppError("User not found", StatusCode.NOT_FOUND);
    
    const favourites = (user.favourites as unknown as ({ toObject?: () => any } & Record<string, any>)[]) || [];
    
    // Resolve URLs for each favourite company
    return await Promise.all(
      favourites.map(async (company) => {
        const companyObj = company.toObject ? company.toObject() : company;
        if (companyObj.profile) {
          companyObj.profile = await this._resolveCompanyProfileUrls(companyObj.profile);
        }
        return {
          ...companyObj,
          id: companyObj._id?.toString() || companyObj.id
        };
      })
    );
  }

  // Change Password
  async changePassword(userId: string, hashedPassword: string): Promise<void> {
    const result = await this.model.findByIdAndUpdate(
      userId,
      { $set: { password: hashedPassword } }
    );
    if (!result) throw new AppError("User not found", StatusCode.NOT_FOUND);
  }

  // Verify Password
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.model.findById(userId);
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }
}
