import { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import { IAdmin } from "@/domain/entities/Admin";
import AdminModel from "@/infrastructure/database/models/AdminModel";
import { UserProfile, CompanyProfile, ProfileData } from "@/domain/entities/User";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import UserModel from "@/infrastructure/database/models/UserModel";
import CompanyModel from "@/infrastructure/database/models/CompanyModel";
import { PaginatedResult } from "@/shared/types/PaginatedResult";
import { IStorageService } from "@/domain/services/IStorageService";
import { ILogger } from "@/domain/services/ILogger";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  // 🔵 DB-LAYER METHOD (for admin-specific operations)
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    const admin = await AdminModel.findOne({ email });
    if (!admin) return null;

    return {
      id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      role: admin.role,
      refreshToken: admin.refreshToken,
    };
  }

  async saveRefreshToken(adminId: string, token: string): Promise<void> {
    await AdminModel.findByIdAndUpdate(adminId, { refreshToken: token });
  }

  //search users with pagination in admin panel
  async searchUsers(
    query: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<UserProfile>> {
    const skip = (page - 1) * limit;
    const filter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    };

    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit),
      UserModel.countDocuments(filter),
    ]);

    const data = await Promise.all(
      users.map(async (user) => {
        let profileImage = user.profileImage ?? undefined;
        if (profileImage && !profileImage.startsWith("http")) {
          try {
            profileImage = await this._s3Service.getSignedUrl(profileImage);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve user profileImage: ${user.name}`, { error: err });
          }
        }

        return new UserProfile(
          new UniqueEntityID(user._id.toString()),
          user.name,
          user.email,
          profileImage,
          user.phone ?? undefined,
          user.location ?? undefined,
          user.bio ?? undefined,
          user.isBlocked,
          user.role ?? undefined
        );
      })
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchCompanies(
    query: string,
    page: number,
    limit: number,
    status?: string
  ): Promise<PaginatedResult<CompanyProfile>> {
    const skip = (page - 1) * limit;
    const filter = {
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
      ...(status && status !== "all" ? { documentStatus: status } : {}),
    };

    const [companies, total] = await Promise.all([
      CompanyModel.find(filter).skip(skip).limit(limit).lean(),
      CompanyModel.countDocuments(filter),
    ]);
    
    const data = await Promise.all(
      companies.map(async (c) => {
        // Resolve profile URLs
        let resolvedProfile = c.profile;
        if (resolvedProfile) {
          resolvedProfile = await this._resolveProfileUrls(JSON.parse(JSON.stringify(resolvedProfile)));
        }

        // Resolve documents
        const resolvedDocs: Record<string, string | null> = {};
        if (c.documents) {
          for (const [key, value] of Object.entries(c.documents)) {
             if (value && typeof value === "string") {
               try {
                 resolvedDocs[key] = await this._s3Service.getSignedUrl(value);
               } catch (err) {
                 this._logger.error(`❌ Failed to resolve doc: ${key}`, { error: err });
                 resolvedDocs[key] = value;
               }
             } else {
               resolvedDocs[key] = value as string | null;
             }
          }
        }

        return new CompanyProfile(
          new UniqueEntityID(c._id.toString()),
          c.name,
          c.email,
          c.phone ?? undefined,
          undefined, // location
          c.documentStatus ?? undefined,
          c.isBlocked,
          undefined, // profileImage
          resolvedDocs,
          c.isProfileFilled,
          resolvedProfile as ProfileData
        );
      })
    );
    
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async _resolveProfileUrls(profile: ProfileData): Promise<ProfileData | null> {
    if (!profile) return null;

    // Resolve brand identity
    if (profile.brandIdentity) {
      const keys = ["logo", "banner1", "banner2", "profilePicture"] as const;
      for (const key of keys) {
        if (profile.brandIdentity[key]) {
          try {
            profile.brandIdentity[key] = await this._s3Service.getSignedUrl(profile.brandIdentity[key] as string);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve ${key}`, { error: err });
          }
        }
      }
    }

    // Resolve team members
    if (profile.teamMembers && Array.isArray(profile.teamMembers)) {
      for (const member of profile.teamMembers) {
        if (member.photo) {
          try {
            member.photo = await this._s3Service.getSignedUrl(member.photo);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve team member photo: ${member.name}`, { error: err });
          }
        }
      }
    }

    // Resolve projects
    if (profile.projects && Array.isArray(profile.projects)) {
      for (const project of profile.projects) {
        if (project.beforeImage) {
          try {
            project.beforeImage = await this._s3Service.getSignedUrl(project.beforeImage);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve project beforeImage: ${project.title}`, { error: err });
          }
        }
        if (project.afterImage) {
          try {
            project.afterImage = await this._s3Service.getSignedUrl(project.afterImage);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve project afterImage: ${project.title}`, { error: err });
          }
        }
      }
    }

    return profile;
  }

  // Nullish Coalescing Operator (??)
  //value ?? defaultValue,if value is null or undefined,return defaultValue

  //Logical OR Operator (||)
  //value || defaultValue,if value is falsy(return false,0,"",null,undefined,NaN),return defaultValue
}
