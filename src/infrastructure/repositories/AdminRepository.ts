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
import { AdminMapper } from "@/application/mappers/AdminMapper";
import BookingModel from "@/infrastructure/database/models/BookingModel";
import TransactionModel from "@/infrastructure/database/models/TransactionModel";
import { IDashboardStats } from "@/domain/repositories/IAdminRepository";

@injectable()
export class AdminRepository implements IAdminRepository {
  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  async getDashboardStats(): Promise<IDashboardStats> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalUsers,
      totalCompanies,
      totalBookings,
      pendingVerifications,
      revenueStats,
      activeSubCompanies,
      userGrowthRaw,
      companyGrowthRaw,
      revenueByType,
      recentUsers,
      recentCompanies,
      recentBookings
    ] = await Promise.all([
      UserModel.countDocuments(),
      CompanyModel.countDocuments(),
      BookingModel.countDocuments(),
      CompanyModel.countDocuments({ documentStatus: "pending" }),
      TransactionModel.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            gross: { $sum: { $cond: [{ $in: ["$type", ["booking_payment", "subscription_payment"]] }, "$amount", 0] } },
            net: { $sum: { $cond: [{ $eq: ["$type", "admin_commission"] }, "$amount", 0] } }
          }
        }
      ]),
      CompanyModel.countDocuments({ isSubscribed: true }),
      UserModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      CompanyModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      TransactionModel.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: "$type", value: { $sum: "$amount" } } },
        { $project: { label: "$_id", value: 1, _id: 0 } }
      ]),
      UserModel.find().sort({ createdAt: -1 }).limit(3).lean(),
      CompanyModel.find().sort({ createdAt: -1 }).limit(3).lean(),
      BookingModel.find().sort({ createdAt: -1 }).limit(4).populate("userId").populate("companyId").lean()
    ]);

    const rev = revenueStats[0] || { gross: 0, net: 0 };

    const activities: {
      icon: string;
      title: string;
      description: string;
      time: string;
      rawTime: Date;
    }[] = [];
    
    recentUsers.forEach((u) => {
      const user = u as { name: string; createdAt: Date };
      activities.push({
        icon: "FaUserPlus",
        title: "New User Registration",
        description: `${user.name} joined as a homeowner`,
        time: this._getTimeAgo(new Date(user.createdAt)),
        rawTime: new Date(user.createdAt)
      });
    });

    recentCompanies.forEach((c) => {
      const company = c as unknown as { name: string; createdAt: Date };
      activities.push({
        icon: "FaBuilding",
        title: "Company Registration",
        description: `${company.name} submitted for review`,
        time: this._getTimeAgo(new Date(company.createdAt)),
        rawTime: new Date(company.createdAt)
      });
    });

    recentBookings.forEach((b) => {
      const booking = b as { startTime: string; createdAt: Date };
      activities.push({
        icon: "FaCalendar",
        title: "New Booking",
        description: `New slot booked at ${booking.startTime}`,
        time: this._getTimeAgo(new Date(booking.createdAt)),
        rawTime: new Date(booking.createdAt)
      });
    });

    const sortedActivities = activities
      .sort((a, b) => b.rawTime.getTime() - a.rawTime.getTime())
      .slice(0, 10)
      .map(({ rawTime: _, ...rest }) => ({ ...rest }));

    return {
      totalUsers,
      totalCompanies,
      totalBookings,
      pendingVerifications,
      grossRevenue: rev.gross,
      netRevenue: rev.net,
      activeSubscriptions: {
        users: 0, // Not tracked in schema
        companies: activeSubCompanies
      },
      userGrowth: {
        users: userGrowthRaw.map(g => ({ month: g._id, count: g.count })),
        companies: companyGrowthRaw.map(g => ({ month: g._id, count: g.count }))
      },
      revenueBreakdown: revenueByType.map(r => ({
        label: r.label.split("_").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        value: r.value
      })),
      recentActivities: sortedActivities
    };
  }

  private _getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  }

  // 🔵 DB-LAYER METHOD (for admin-specific operations)
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    const admin = await AdminModel.findOne({ email });
    if (!admin) return null;

    return AdminMapper.toDomain(admin);
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
        if (profileImage && !profileImage.startsWith("http") && !profileImage.startsWith("data:")) {
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
              if (value.startsWith("http") || value.startsWith("data:")) {
                resolvedDocs[key] = value;
              } else {
                try {
                  resolvedDocs[key] = await this._s3Service.getSignedUrl(value);
                } catch (err) {
                  this._logger.error(`❌ Failed to resolve doc: ${key}`, { error: err });
                  resolvedDocs[key] = value;
                }
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
          c.isSubscribed,
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
          const url = profile.brandIdentity[key] as string;
          if (url.startsWith("http") || url.startsWith("data:")) {
            // Already a full URL
          } else {
            try {
              profile.brandIdentity[key] = await this._s3Service.getSignedUrl(url);
            } catch (err) {
              this._logger.error(`❌ Failed to resolve ${key}`, { error: err });
            }
          }
        }
      }
    }

    // Resolve team members
    if (profile.teamMembers && Array.isArray(profile.teamMembers)) {
      for (const member of profile.teamMembers) {
        if (member.photo) {
          if (member.photo.startsWith("http") || member.photo.startsWith("data:")) {
            // Already a full URL
          } else {
            try {
              member.photo = await this._s3Service.getSignedUrl(member.photo);
            } catch (err) {
              this._logger.error(`❌ Failed to resolve team member photo: ${member.name}`, { error: err });
            }
          }
        }
      }
    }

    // Resolve projects
    if (profile.projects && Array.isArray(profile.projects)) {
      for (const project of profile.projects) {
        if (project.beforeImage) {
          if (project.beforeImage.startsWith("http") || project.beforeImage.startsWith("data:")) {
             // Already a full URL
          } else {
            try {
              project.beforeImage = await this._s3Service.getSignedUrl(project.beforeImage);
            } catch (err) {
              this._logger.error(`❌ Failed to resolve project beforeImage: ${project.title}`, { error: err });
            }
          }
        }
        if (project.afterImage) {
          if (project.afterImage.startsWith("http") || project.afterImage.startsWith("data:")) {
            // Already a full URL
          } else {
            try {
              project.afterImage = await this._s3Service.getSignedUrl(project.afterImage);
            } catch (err) {
              this._logger.error(`❌ Failed to resolve project afterImage: ${project.title}`, { error: err });
            }
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
