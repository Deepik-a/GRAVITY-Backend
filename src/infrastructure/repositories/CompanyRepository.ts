
import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import CompanyModel from "@/infrastructure/database/models/CompanyModel";
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
  extends BaseRepository<typeof CompanyModel.prototype>
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
  private async _resolveProfileUrls(profile: ICompany["profile"]): Promise<ICompany["profile"]> {
    if (!profile) return null;

    // Resolve brand identity
    if (profile.brandIdentity) {
      const keys: (keyof typeof profile.brandIdentity)[] = ["logo", "banner1", "banner2", "profilePicture"];
      for (const key of keys) {
        if (profile.brandIdentity[key]) {
          try {
            profile.brandIdentity[key] = await this._s3Service.getSignedUrl(profile.brandIdentity[key]);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve ${String(key)}`, { error: err });
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
      new UniqueEntityID(created._id),
      created.name,
      created.email,
      created.password,
      created.role,
      created.provider,
      created.phone ?? "",
      created.status ?? "pending"
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
        rawData.password,                           // 4
        rawData.role,                               // 5
        rawData.provider,                           // 6
        rawData.phone,                              // 7
        rawData.status,                             // 8
        rawData.documentStatus,                     // 9
        rawData.rejectionReason,                    // 10
        rawData.isBlocked ?? false,                 // 11 
        !!rawData.profile                           // 12
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
      created.provider,
      created.status,
      new UniqueEntityID(created._id.toString()),
      created.documentStatus,
      created.rejectionReason,
      created.isBlocked ?? false,
      !!created.profile
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
    found.provider,
    found.status,
    new UniqueEntityID(found._id.toString()),
    found.documentStatus ?? "pending",
    found.rejectionReason,
    found.isBlocked ?? false,
    !!found.profile
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
      found.provider,
      found.status,
      new UniqueEntityID(found._id.toString()),
      found.documentStatus ?? "pending", // ✅ Default to pending if missing
      found.rejectionReason,
      found.isBlocked ?? false,
      !!found.profile
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const found = await this.model.findById(id);
    if (!found) return null;

    return new UserProfile(
      new UniqueEntityID(found._id.toString()),
      found.name,
      found.email,
      found.profileImage,
      found.phone,
      found.location,
      found.bio
    );
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID(updated._id.toString()),
      updated.name,
      updated.email,
      updated.profileImage,
      updated.phone,
      updated.location,
      updated.bio
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
            const signed = await this._s3Service.getSignedUrl(fileKey);
            resolvedDocuments[field] = signed;
            this._logger.info(
              `🔑 Signed URL generated successfully (short): ${signed.slice(0, 90)}...`
            );
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
    isProfileFilled: updated.isProfileFilled
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
    
    // Resolve URLs before returning
    if (updated.profile) {
      updated.profile = await this._resolveProfileUrls(updated.profile);
    }
    
    return updated;
  }

async deleteProfile(companyId: string): Promise<ICompany | null> {
  const updated = await this.model.findByIdAndUpdate(
    companyId,
    { $set: { profile: null, isProfileFilled: false } },
    { new: true }
  ).lean<ICompany>();

  if (!updated) return null;
  return updated;
}

async getProfile(companyId: string): Promise<ICompany | null> {
  const company = await this.model.findById(companyId).lean<ICompany>();
  if (!company) return null;

  if (company.profile) {
    company.profile = await this._resolveProfileUrls(company.profile);
  }

  // Also fix the ID mapping if needed (BaseRepository might store as _id)
  return {
    ...company,
    id: (company as { _id?: ObjectId })._id?.toString() || company.id
  };
}
}

