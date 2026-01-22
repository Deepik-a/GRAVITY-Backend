
import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import CompanyModel, { ICompany as ICompanyDoc } from "@/infrastructure/database/models/CompanyModel";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { UserSignUp, GoogleSignUp, UserProfile } from "@/domain/entities/User";
import { ICompany } from "@/domain/entities/Company";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { IStorageService } from "@/domain/services/IStorageService";
import { ObjectId } from "mongodb";
import { inject, injectable ,unmanaged} from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
  
@injectable()
export class CompanyRepository
  extends BaseRepository<any>
  implements IAuthRepository, ICompanyRepository
{
  constructor(
       @unmanaged() companyModel = CompanyModel, // Ignore in DI
      @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
      @inject(TYPES.Logger) private readonly _logger: ILogger,
  ) {
    super(companyModel); // ✅ required call to BaseRepository
  }

  /* --------------------------------------------------
      RESOLVE PROFILE URLS HELPER
    -------------------------------------------------- */
  private async _resolveProfileUrls(profile: any): Promise<any> {
    if (!profile) return null;

    // Resolve brand identity
    if (profile.brandIdentity) {
      const keys: (keyof typeof profile.brandIdentity)[] = ["logo", "banner1", "banner2", "profilePicture"];
      for (const key of keys) {
        if (profile.brandIdentity[key]) {
          const url = profile.brandIdentity[key];
          if (url.startsWith("http") || url.startsWith("data:")) {
            // Already a full URL
          } else {
            try {
              profile.brandIdentity[key] = await this._s3Service.getSignedUrl(url);
            } catch (err) {
              this._logger.error(`❌ Failed to resolve ${String(key)}`, { error: err });
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

  // -------------------------------------------
  // 💠 AUTH METHODS (from IAuthRepository)
  // -------------------------------------------

  async create(user: UserSignUp): Promise<UserSignUp> {
    const created = await this.model.create({
      name: user.name,
      email: user.email,
      password: user.password,
      role: "company",
      provider: "local",
      phone: user.phone ?? "",
      status: user.status ?? "pending",
    });

    return new UserSignUp(
      new UniqueEntityID((created._id as ObjectId).toString()),
      created.name,
      created.email,
      created.password || "",
      created.role,
      (created as any).provider,
      created.phone ?? "",
      created.status ?? "pending",
      undefined, // documentStatus
      undefined, // rejectionReason
      created.isBlocked ?? false,
      !!created.profile,
      created.isSubscribed ?? false
    );
  }

// Inside your CompanyAuthRepository implementation...

async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email });
    if (!found) return null;
    
    const rawData = found.toObject(); 

    return new UserSignUp(
        new UniqueEntityID(rawData._id.toString()), // 1
        rawData.name,                               // 2
        rawData.email,                              // 3
        rawData.password || "",                     // 4
        rawData.role,                               // 5
        (rawData as any).provider,                  // 6
        rawData.phone,                              // 7
        rawData.status,                             // 8
        rawData.documentStatus,                     // 9
        rawData.rejectionReason,                    // 10
        rawData.isBlocked ?? false,                 // 11 
        !!rawData.profile,                          // 12
        rawData.isSubscribed ?? false               // 13
    );
}
  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await this.model.updateOne({ email }, { $set: { password: hashedPassword } });
  }

  async createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp> {
    const created = await this.model.create({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      role: "company",
      provider: "google",
      status: user.status ?? "pending",
      documentStatus: "pending", // ✅ Initialize documentStatus
    });

    return new GoogleSignUp(
      created.name,
      created.email,
      created.googleId ?? "",
      created.role,
      (created as any).provider,
      created.status,
      new UniqueEntityID(created._id.toString()),
      created.documentStatus,
      created.rejectionReason,
      created.isBlocked ?? false,
      !!created.profile,
      created.isSubscribed ?? false
    );
  }

 async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
  const found = await this.model.findOne({ email, googleId: { $ne: null } });
  if (!found) return null;

  return new GoogleSignUp(
    found.name,
    found.email,
    found.googleId ?? "",
    found.role,
    (found as any).provider,
    found.status,
    new UniqueEntityID(found._id.toString()),
    found.documentStatus ?? "pending",
    found.rejectionReason,
    found.isBlocked ?? false,
    !!found.profile,
    found.isSubscribed ?? false
  );
}
  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ googleId, provider: "google" });
    if (!found) return null;

    return new GoogleSignUp(
      found.name,
      found.email,
      found.googleId ?? "",
      found.role,
      (found as any).provider,
      found.status,
      new UniqueEntityID(found._id.toString()),
      found.documentStatus ?? "pending", // ✅ Default to pending if missing
      found.rejectionReason,
      found.isBlocked ?? false,
      !!found.profile,
      found.isSubscribed ?? false
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const found = await this.model.findById(id);
    if (!found) return null;

    return new UserProfile(
      new UniqueEntityID(found._id.toString()),
      found.name,
      found.email,
      (found as any).profileImage || undefined,
      found.phone || undefined,
      (found as any).location || undefined,
      (found as any).bio || undefined,
      found.isBlocked || false,
      found.role || "company"
    );
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID(updated._id.toString()),
      updated.name,
      updated.email,
      (updated as any).profileImage || undefined,
      updated.phone || undefined,
      (updated as any).location || undefined,
      (updated as any).bio || undefined
    );
  }
/* --------------------------------------------------
      UPDATE DOCUMENT KEYS (NOT SIGNED URL)
    -------------------------------------------------- */
  async updateDocuments(
    email: string,
    docs: {
      GST_Certificate?: string | null;
      RERA_License?: string | null;
      Trade_License?: string | null;
    }
  ): Promise<ICompany> {

    this._logger.info("📌 [Repository:updateDocuments] Incoming Request");
    this._logger.info("➡️ Email:", { email });
    this._logger.info("➡️ Received payload:", { docs });

    const updated = await this.model.findOneAndUpdate(
      { email },
      {
        $set: {
          "documents.GST_Certificate": docs.GST_Certificate,
          "documents.RERA_License": docs.RERA_License,
          "documents.Trade_License": docs.Trade_License,
        },
      },
      { new: true }
    ).lean<ICompany>();

    if (!updated) {
      this._logger.info("❌ No company found for email:", { email });
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    this._logger.info("✅ Stored document keys in DB:", { documents: updated.documents });
    return updated;
  }

  /* --------------------------------------------------
      UPDATE DOCUMENT STATUS
    -------------------------------------------------- */
async updateDocumentStatus(
  identifier: { email?: string; companyId?: string },
  status: "pending" | "verified" | "rejected",
  reason?: string
): Promise<ICompany> {
  
  const filter: Record<string, string | undefined> = {};
  if (identifier.email) filter.email = identifier.email;
  if (identifier.companyId) filter._id = identifier.companyId;

  const updateData: Record<string, string> = {
    documentStatus: status,
    status: status === "verified" ? "verified" : "pending",
  };

  if (status === "rejected" && reason) {
    updateData["documents.rejectionReason"] = reason;
  }

  const updated = await CompanyModel.findOneAndUpdate(filter, {
    $set: updateData,
  }, { new: true }).lean();

  if (!updated) throw new AppError("Company not found", StatusCode.NOT_FOUND);

return {
  id: updated._id.toString(),
  name: updated.name,
  email: updated.email,
  phone: updated.phone ?? null,
  role: updated.role,
  status: updated.status,
  documentStatus: updated.documentStatus,
  rejectionReason: updated.rejectionReason ?? null,
  isBlocked: updated.isBlocked,
  isProfileFilled: updated.isProfileFilled,
  isSubscribed: updated.isSubscribed,
  subscription: updated.subscription ? {
    ...updated.subscription,
    planId: updated.subscription.planId?.toString()
  } : undefined,
  documents: {
    GST_Certificate: updated.documents?.GST_Certificate ?? null,
    RERA_License: updated.documents?.RERA_License ?? null,
    Trade_License: updated.documents?.Trade_License ?? null,
  }
};

}


  /* --------------------------------------------------
      SAVE COMPANY
    -------------------------------------------------- */
  async save(company: ICompany): Promise<ICompany> {
    this._logger.info("📌 [Repository:save] Updating company", { email: company.email });

    const updated = await this.model.findOneAndUpdate(
      { email: company.email },
      { $set: company },
      { new: true }
    ).lean<ICompany>();

    if (!updated) throw new AppError("Company not found", StatusCode.NOT_FOUND);

    this._logger.info("✅ Company updated successfully");
    return updated;
  }

  /* --------------------------------------------------
      GET ALL COMPANIES WITH SIGNED URL MAPPING
      (FULL PROFILE DATA FOR FRONTEND)
    -------------------------------------------------- */
  async getAllCompanies(): Promise<ICompany[]> {
    this._logger.info("📌 [Repository:getAllCompanies] Fetch triggered");

    const companiesFromDb = await this.model.find().lean();
    this._logger.info(`📦 Found ${companiesFromDb.length} companies in DB`);

    type DocumentField = "GST_Certificate" | "RERA_License" | "Trade_License";

    return await Promise.all(
      companiesFromDb.map(async (c) => {
        this._logger.info(`\n🔹 Resolving documents for: ${c.name} (${c.email})`);
        this._logger.info("🧩 Stored Document Keys:", { documents: c.documents });

        const resolvedDocuments: Record<DocumentField, string | null> = {
          GST_Certificate: null,
          RERA_License: null,
          Trade_License: null,
        };

        // Use a typed array to iterate safely
        const documentFields: DocumentField[] = ["GST_Certificate", "RERA_License", "Trade_License"];

        for (const field of documentFields) {
          const fileKey = c.documents?.[field];

          if (!fileKey) {
            this._logger.info(`⚠️ No file for ${field}`);
            continue;
          }

          this._logger.info(`📁 Generating signed URL for -> ${field}: ${fileKey}`);

          try {
            if (fileKey.startsWith("http") || fileKey.startsWith("data:")) {
              resolvedDocuments[field] = fileKey;
            } else {
              const signed = await this._s3Service.getSignedUrl(fileKey);
              resolvedDocuments[field] = signed;
              this._logger.info(
                `🔑 Signed URL generated successfully (short): ${signed.slice(0, 90)}...`
              );
            }
          } catch (err) {
            this._logger.error(`❌ Failed to generate signed URL for: ${fileKey}`, { error: err });
          }
        }

        // Return full company data, including complete profile with all nested fields
        type CompanyDoc = typeof c & { profile?: ICompany["profile"] };
        const rawProfile = (c as CompanyDoc).profile;
        const mappedProfile: ICompany["profile"] | null = rawProfile
          ? {
              companyName: rawProfile.companyName || "",
              categories: rawProfile.categories || [],
              services: rawProfile.services || [],
              consultationFee: rawProfile.consultationFee || 0,
              establishedYear: rawProfile.establishedYear || 2024,
              companySize: rawProfile.companySize || "",
              overview: rawProfile.overview || "",
              projectsCompleted: rawProfile.projectsCompleted || 0,
              happyCustomers: rawProfile.happyCustomers || 0,
              awardsWon: rawProfile.awardsWon || 0,
              awardsRecognition: rawProfile.awardsRecognition || "",
              contactOptions: {
                chatSupport: rawProfile.contactOptions?.chatSupport ?? true,
                videoCalls: rawProfile.contactOptions?.videoCalls ?? false,
              },
              teamMembers: rawProfile.teamMembers || [],
              projects: rawProfile.projects || [],
              brandIdentity: {
                logo: rawProfile.brandIdentity?.logo || undefined,
                banner1: rawProfile.brandIdentity?.banner1 || undefined,
                banner2: rawProfile.brandIdentity?.banner2 || undefined,
                profilePicture: rawProfile.brandIdentity?.profilePicture || undefined,
              },
            }
          : null;

        const mappedCompany: ICompany = {
          id: (c._id as ObjectId).toString(),
          name: c.name,
          email: c.email,
          phone: c.phone ?? null,
          role: c.role,
          status: c.status,
          documents: resolvedDocuments,
          documentStatus: c.documentStatus,
          rejectionReason: c.rejectionReason ?? null,
          location: c.location ?? null,
          isBlocked: c.isBlocked,
          isProfileFilled: c.isProfileFilled,
          isSubscribed: c.isSubscribed,
          subscription: c.subscription ? {
            ...c.subscription,
            planId: c.subscription.planId?.toString()
          } : undefined,
          profile: await this._resolveProfileUrls(mappedProfile),
        };

        return mappedCompany;
      })
    );
  }

async updateBlockStatus(companyId: string, isBlocked: boolean): Promise<ICompany | null> {
  const updated = await CompanyModel.findByIdAndUpdate(
    companyId,
    { $set: { isBlocked } },
    { new: true }
  ).lean();

  if (!updated) return null;

  return {
    id: (updated._id as unknown as ObjectId).toString(),
    name: updated.name,
    email: updated.email,
    phone: updated.phone ?? null,
    role: updated.role,
    status: updated.status,
    documentStatus: updated.documentStatus,
    documents: {
         GST_Certificate: updated.documents?.GST_Certificate ?? null ,
        RERA_License: updated.documents?.RERA_License ?? null,
        Trade_License: updated.documents?.Trade_License ?? null,
    },
    rejectionReason: updated.rejectionReason,
    isBlocked: updated.isBlocked,
    isProfileFilled: updated.isProfileFilled,
    isSubscribed: updated.isSubscribed,
    subscription: updated.subscription ? {
      ...updated.subscription,
      planId: updated.subscription.planId?.toString()
    } : undefined
  };
}

  async updateProfile(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(
      companyId,
      { 
        $set: { 
          profile: profileData, 
          isProfileFilled: true,
          name: profileData.companyName || "" // Sync root name with profile company name
        } 
      },
      { new: true }
    ).lean<ICompany>();

    if (!updated) return null;
    return this._mapToCompany(updated);
  }

async deleteProfile(companyId: string): Promise<ICompany | null> {
  const updated = await this.model.findByIdAndUpdate(
    companyId,
    { $set: { profile: null, isProfileFilled: false } },
    { new: true }
  ).lean();

  if (!updated) return null;
  return this._mapToCompany(updated);
}

async getProfile(companyId: string): Promise<ICompany | null> {
  const company = await this.model.findById(companyId).lean();
  if (!company) return null;
  return this._mapToCompany(company);
}

  async getCompanies(params: {
    query?: string;
    page: number;
    limit: number;
    category?: string[];
    services?: string[];
    companySize?: string;
    minPrice?: number;
    maxPrice?: number;
    minExperience?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<{
    data: ICompany[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      query,
      page,
      limit,
      category,
      services,
      companySize,      minPrice,
      maxPrice,
      minExperience,
      sortBy,
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * limit;
    const currentYear = new Date().getFullYear();

    const filter: Record<string, any> = {
      isBlocked: false,
      documentStatus: "verified",
      isProfileFilled: true,
    };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { "profile.companyName": { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    if (category && category.length > 0) {
      filter["profile.categories"] = { $in: category };
    }

    if (services && services.length > 0) {
      filter["profile.services"] = { $in: services };
    }

    if (companySize) {
      filter["profile.companySize"] = companySize;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter["profile.consultationFee"] = {};
      if (minPrice !== undefined) filter["profile.consultationFee"].$gte = minPrice;
      if (maxPrice !== undefined) filter["profile.consultationFee"].$lte = maxPrice;
    }

    if (minExperience !== undefined) {
      filter["profile.establishedYear"] = { $lte: currentYear - minExperience };
    }

    const sort: Record<string, any> = {};
    if (sortBy) {
      if (sortBy === "experience") {
        sort["profile.establishedYear"] = sortOrder === "asc" ? -1 : 1; // More experience means lower year
      } else if (sortBy === "price") {
        sort["profile.consultationFee"] = sortOrder === "asc" ? 1 : -1;
      } else {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }
    } else {
      sort.createdAt = -1;
    }

    const [companies, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    const resolvedData = await Promise.all(
      companies.map(async (c) => {
        const mappedCompany: ICompany = {
          id: (c as any)._id.toString(),
          name: c.name,
          email: c.email,
          phone: c.phone ?? null,
          role: c.role,
          status: c.status,
          documents: c.documents,
          documentStatus: c.documentStatus,
          rejectionReason: c.rejectionReason ?? null,
          location: c.location ?? null,
          isBlocked: c.isBlocked,
          isProfileFilled: c.isProfileFilled,
          isSubscribed: c.isSubscribed,
          subscription: c.subscription ? {
            ...c.subscription,
            planId: c.subscription.planId?.toString()
          } : undefined,
          profile: await this._resolveProfileUrls(c.profile),
        };
        return mappedCompany;
      })
    );

    return {
      data: resolvedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

   async updateSubscription(companyId: string, subscription: any): Promise<void> {
    console.log(`[CompanyRepository] Updating subscription for company: ${companyId}`);
    // Sync root isSubscribed with subscription.status
    const isSubscribed = subscription.status === 'active';
    await this.model.findByIdAndUpdate(companyId, { $set: { subscription, isSubscribed } });
  }

  async findCompanyById(id: string): Promise<ICompany | null> {
    const found = await this.model.findById(id).lean();
    if (!found) return null;
    return this._mapToCompany(found);
  }

  // Helper to map and resolve
  private async _mapToCompany(c: any): Promise<ICompany> {
     // Cast to explicit Record<string, any> to avoid TS errors on dynamic properties
     const doc = c as Record<string, any>;
     const mappedCompany: ICompany = {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          phone: doc.phone ?? null,
          role: doc.role,
          status: doc.status,
          documents: doc.documents,
          documentStatus: doc.documentStatus,
          rejectionReason: doc.rejectionReason ?? null,
          location: doc.location ?? null,
          isBlocked: doc.isBlocked,
          isProfileFilled: doc.isProfileFilled,
          isSubscribed: doc.isSubscribed,
          walletBalance: doc.walletBalance || 0,
          subscription: doc.subscription ? {
            ...doc.subscription,
            planId: doc.subscription.planId?.toString()
          } : undefined,
          profile: await this._resolveProfileUrls(doc.profile),
    };
    return mappedCompany;
  }

  async update(id: string, updates: Partial<ICompany>): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }
}

