import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "@/infrastructure/database/models/UserModel";
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
import { Messages } from "@/shared/constants/message";

@injectable()
export class UserRepository
  implements IAuthRepository, IUserRepository
{
  private readonly model = UserModel;

  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  private async _resolveUserImageUrl(url?: string): Promise<string | undefined> {
    if (!url || url.startsWith("http") || url.startsWith("data:")) return url;
    try {
      return await this._s3Service.getSignedUrl(url);
    } catch (err) {
      this._logger.error(`// Failed to resolve user profile image: ${url}`, { error: err });
      return url;
    }
  }

  private async _resolveCompanyProfileUrls(profile: unknown): Promise<Record<string, unknown> | null> {
    if (!profile) return null;
    const p = profile as Record<string, unknown>;
    const brandIdentity = p.brandIdentity as Record<string, string | undefined> | undefined;
    if (brandIdentity) {
      const keys: ("logo" | "banner1" | "banner2" | "profilePicture")[] = ["logo", "banner1", "banner2", "profilePicture"];
      for (const key of keys) {
        const val = brandIdentity[key];
        if (val && typeof val === "string" && !val.startsWith("http")) {
          try {
            brandIdentity[key] = await this._s3Service.getSignedUrl(val);
          } catch (err) {
            this._logger.error(`// Failed to resolve company ${key}`, { error: err });
          }
        }
      }
    }
    return p;
  }

  async create(user: UserSignUp): Promise<UserSignUp> {
    const created = await this.model.create({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      provider: "local",
      phone: user.phone,
      status: user.status ?? "pending",
    });

    return new UserSignUp(
      new UniqueEntityID((created as { _id: Types.ObjectId })._id.toString()),
      created.name,
      created.email,
      created.password || "",
      (created.role as "user" | "company") || "user",
      created.provider as "local" | "google",
      created.phone || "",
      created.status as "pending" | "verified",
      created.documentStatus as "pending" | "verified" | "rejected",
      created.rejectionReason,
      created.isBlocked
    );
  }

  async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email }).exec();
    if (!found) return null;

    return new UserSignUp(
      new UniqueEntityID((found as { _id: Types.ObjectId })._id.toString()),
      found.name,
      found.email,
      found.password || "",
      (found.role as "user" | "company") || "user",
      found.provider as "local" | "google",
      found.phone ?? "",
      found.status as "pending" | "verified",
      found.documentStatus as "pending" | "verified" | "rejected",
      found.rejectionReason,
      found.isBlocked,
      found.isProfileFilled,
      found.isSubscribed
    );
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const result = await this.model.updateOne(
      { email, provider: "local" },
      { $set: { password: hashedPassword } }
    );
    if (result.matchedCount === 0) throw new AppError(Messages.USER.NOT_FOUND, StatusCode.NOT_FOUND);
  }

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
      created.role as "user" | "company",
      created.provider as "local" | "google",
      created.status as "pending" | "verified",
      new UniqueEntityID((created as { _id: Types.ObjectId })._id.toString()),
      created.documentStatus as "pending" | "verified" | "rejected",
      created.rejectionReason,
      created.isBlocked
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ email, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(
      record.name,
      record.email,
      record.googleId ? record.googleId : "",
      record.role as "user" | "company",
      record.provider as "local" | "google",
      record.status as "pending" | "verified",
      new UniqueEntityID((record as { _id: Types.ObjectId })._id.toString()),
      record.documentStatus as "pending" | "verified" | "rejected",
      record.rejectionReason,
      record.isBlocked
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ googleId, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(
      record.name,
      record.email,
      record.googleId ? record.googleId : "",
      record.role as "user" | "company",
      record.provider as "local" | "google",
      record.status as "pending" | "verified",
      new UniqueEntityID((record as { _id: Types.ObjectId })._id.toString()),
      record.documentStatus as "pending" | "verified" | "rejected",
      record.rejectionReason,
      record.isBlocked
    );
  }

  async findById(userId: string): Promise<UserProfile | null> {
    const user = await this.model.findById(userId).exec();
    if (!user) return null;

    return new UserProfile(
      new UniqueEntityID((user as { _id: Types.ObjectId })._id.toString()),
      user.name,
      user.email,
      await this._resolveUserImageUrl(user.profileImage ?? undefined),
      user.phone ?? undefined,
      user.location ?? undefined,
      user.bio ?? undefined,
      user.isBlocked ?? false,
      user.role,
      undefined, // bookingCount
      user.walletBalance
    );
  }

  async updateProfile(userId: string, updates: Record<string, unknown>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec();
    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID((updated as { _id: Types.ObjectId })._id.toString()),
      updated.name,
      updated.email,
      await this._resolveUserImageUrl(updated.profileImage ?? undefined),
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined,
      updated.isBlocked,
      updated.role,
      undefined, // bookingCount
      updated.walletBalance
    );
  }

  async updateUserProfile(userId: string, updates: Record<string, unknown>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec();
    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID((updated as { _id: Types.ObjectId })._id.toString()),
      updated.name,
      updated.email,
      await this._resolveUserImageUrl(updated.profileImage ?? undefined),
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined,
      updated.isBlocked,
      updated.role,
      undefined, // bookingCount
      updated.walletBalance
    );
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const users = await this.model.find({ role: "user" }).exec();
    return Promise.all(
      users.map(async (u) => 
        new UserProfile(
          new UniqueEntityID((u as { _id: Types.ObjectId })._id.toString()),
          u.name,
          u.email,
          await this._resolveUserImageUrl(u.profileImage ?? undefined),
          u.phone ?? undefined,
          u.location ?? undefined,
          u.bio ?? undefined,
          u.isBlocked,
          u.role,
          undefined, // bookingCount
          u.walletBalance
        )
      )
    );
  }

  async updateBlockStatus(userId: string, isBlocked: boolean): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(userId, { $set: { isBlocked } }, { new: true }).exec();
    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID((updated as { _id: Types.ObjectId })._id.toString()),
      updated.name,
      updated.email,
      await this._resolveUserImageUrl(updated.profileImage ?? undefined),
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined,
      updated.isBlocked,
      updated.role,
      undefined, // bookingCount
      updated.walletBalance
    );
  }

  async toggleFavourite(userId: string, companyId: string): Promise<string[]> {
    const user = await this.model.findById(userId);
    if (!user) throw new AppError(Messages.USER.NOT_FOUND, StatusCode.NOT_FOUND);

    const isFavourite = user.favourites.some((id: Types.ObjectId) => id.toString() === companyId);
    let updatedUser;
    if (isFavourite) {
      updatedUser = await this.model.findByIdAndUpdate(
          userId,
          { $pull: { favourites: new Types.ObjectId(companyId) } },
          { new: true }
      );
    } else {
      updatedUser = await this.model.findByIdAndUpdate(
          userId,
          { $addToSet: { favourites: new Types.ObjectId(companyId) } },
          { new: true }
      );
    }

    return updatedUser?.favourites.map((id: Types.ObjectId) => id.toString()) || [];
  }

  async getFavourites(userId: string): Promise<ICompany[]> {
    const user = await this.model.findById(userId).populate("favourites").exec();
    if (!user) throw new AppError(Messages.USER.NOT_FOUND, StatusCode.NOT_FOUND);

    const favourites = (user.favourites as unknown[]) || [];
    const resolvedFavourites = await Promise.all(
      favourites.map(async (f) => {
        const companyObj = f as { _id?: Types.ObjectId; id?: string; profile?: Record<string, unknown>; toObject?: () => Record<string, unknown> };
        const plainCompany = companyObj.toObject ? companyObj.toObject() : companyObj;
        if (plainCompany.profile) {
          plainCompany.profile = await this._resolveCompanyProfileUrls(plainCompany.profile);
        }
        return {
          ...plainCompany,
          id: plainCompany._id?.toString() || plainCompany.id
        } as ICompany;
      })
    );

    return resolvedFavourites;
  }

  async changePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.model.findByIdAndUpdate(userId, { $set: { password: hashedPassword } });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.model.findById(userId).exec();
    if (!user || !user.password) return false;
    return await bcrypt.compare(password, user.password);
  }
}
