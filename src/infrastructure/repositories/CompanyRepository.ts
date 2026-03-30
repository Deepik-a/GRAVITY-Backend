import CompanyModel from "@/infrastructure/database/models/CompanyModel";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { UserSignUp, GoogleSignUp, UserProfile } from "@/domain/entities/User";
import { ICompany, ICompanyProfile } from "@/domain/entities/Company";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { IStorageService } from "@/domain/services/IStorageService";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { Messages } from "@/shared/constants/message";

@injectable()
export class CompanyRepository
  implements IAuthRepository, ICompanyRepository
{
  private readonly model = CompanyModel;

  constructor(
      @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
      @inject(TYPES.Logger) private readonly _logger: ILogger,
  ) {}

  private async _resolveProfileUrls(profile: unknown): Promise<ICompanyProfile | null> {
    if (!profile) return null;
    const p = profile as ICompanyProfile;
    if (p.brandIdentity) {
      const keys = ["logo", "banner1", "banner2", "profilePicture"] as const;
      for (const key of keys) {
        const val = p.brandIdentity[key];
        if (val && typeof val === "string" && !val.startsWith("http") && !val.startsWith("data:")) {
          try {
            p.brandIdentity[key] = await this._s3Service.getSignedUrl(val);
          } catch (err) {
            this._logger.error(`❌ Failed to resolve ${key}`, { error: err });
          }
        }
      }
    }
    if (p.teamMembers && Array.isArray(p.teamMembers)) {
      for (const member of p.teamMembers) {
        if (member.photo && !member.photo.startsWith("http") && !member.photo.startsWith("data:")) {
          try {
            member.photo = await this._s3Service.getSignedUrl(member.photo);
          } catch { /* ignore */ }
        }
      }
    }
    if (p.projects && Array.isArray(p.projects)) {
      for (const project of p.projects) {
        if (project.beforeImage && !project.beforeImage.startsWith("http") && !project.beforeImage.startsWith("data:")) {
          try { 
            project.beforeImage = await this._s3Service.getSignedUrl(project.beforeImage); 
          } catch { /* ignore */ }
        }
        if (project.afterImage && !project.afterImage.startsWith("http") && !project.afterImage.startsWith("data:")) {
          try { 
            project.afterImage = await this._s3Service.getSignedUrl(project.afterImage); 
          } catch { /* ignore */ }
        }
      }
    }
    return p;
  }

  private _stripSignedUrls(profile: unknown): any {
    if (!profile) return null;
    const stripped = JSON.parse(JSON.stringify(profile));
    const extractKey = (url: string | undefined): string | undefined => {
      if (!url || !url.startsWith("http") || url.startsWith("data:")) return url;
      try { 
        return new URL(url).pathname.substring(1).split('?')[0]; 
      } catch { 
        return url; 
      }
    };
    if (stripped.brandIdentity) {
      stripped.brandIdentity.logo = extractKey(stripped.brandIdentity.logo);
      stripped.brandIdentity.banner1 = extractKey(stripped.brandIdentity.banner1);
      stripped.brandIdentity.banner2 = extractKey(stripped.brandIdentity.banner2);
      stripped.brandIdentity.profilePicture = extractKey(stripped.brandIdentity.profilePicture);
    }
    if (stripped.teamMembers) {
      stripped.teamMembers = stripped.teamMembers.map((m: any) => ({ ...m, photo: extractKey(m.photo) }));
    }
    if (stripped.projects) {
      stripped.projects = stripped.projects.map((p: any) => ({ ...p, beforeImage: extractKey(p.beforeImage), afterImage: extractKey(p.afterImage) }));
    }
    return stripped;
  }

  async create(user: UserSignUp): Promise<UserSignUp> {
    const created = await this.model.create({ 
        name: user.name, 
        email: user.email, 
        password: user.password, 
        role: "company", 
        provider: "local", 
        status: "pending" 
    });
    const doc = created as any;
    return new UserSignUp(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.password || "", 
        "company", 
        doc.provider as "local" | "google", 
        doc.phone || "", 
        doc.status as "pending" | "verified", 
        doc.documentStatus as any, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email }).exec();
    if (!found) return null;
    const doc = found as any;
    return new UserSignUp(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.password || "", 
        doc.role as "user" | "company", 
        doc.provider as "local" | "google", 
        doc.phone || "", 
        doc.status as "pending" | "verified", 
        doc.documentStatus as any, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
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
        status: "pending" 
    });
    const doc = created as any;
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        "pending", 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus as any, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ email, provider: "google" }).exec();
    if (!found) return null;
    const doc = found as any;
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        doc.status as "pending" | "verified", 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus as any, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ googleId }).exec();
    if (!found) return null;
    const doc = found as any;
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        doc.status as "pending" | "verified", 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus as any, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const found = await this.model.findById(id).exec();
    if (!found) return null;
    const doc = found as any;
    return new UserProfile(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.profileImage || undefined, 
        doc.phone || undefined, 
        doc.companyLocation || undefined, 
        doc.bio || undefined, 
        doc.isBlocked, 
        doc.role
    );
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return null;
    const doc = updated as any;
    return new UserProfile(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.profileImage || undefined, 
        doc.phone || undefined, 
        doc.companyLocation || undefined, 
        doc.bio || undefined
    );
  }

  async save(company: ICompany): Promise<ICompany> {
    const updated = await this.model.findOneAndUpdate({ email: company.email }, { $set: company }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }

  async getAllCompanies(): Promise<ICompany[]> {
    const companies = await this.model.find().lean();
    return await Promise.all(companies.map(async (c: unknown) => this._mapToCompany(c)));
  }

  async updateBlockStatus(companyId: string, isBlocked: boolean): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(companyId, { $set: { isBlocked } }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }

  async updateProfile(companyId: string, profileData: NonNullable<ICompany["profile"]>): Promise<ICompany | null> {
    const cleanedProfile = this._stripSignedUrls(profileData);
    const updated = await this.model.findByIdAndUpdate(companyId, { $set: { profile: cleanedProfile, isProfileFilled: true, name: profileData.companyName || "" } }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }

  async deleteProfile(companyId: string): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(companyId, { $set: { profile: null, isProfileFilled: false } }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }

  async getProfile(companyId: string): Promise<ICompany | null> {
    return this.findCompanyById(companyId);
  }

  async getCompanies(params: any): Promise<any> {
    const { page = 1, limit = 10, query, category, services, companySize, minPrice, maxPrice, minExperience, sortBy, sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;
    const currentYear = new Date().getFullYear();
    const filter: any = { isBlocked: false, documentStatus: "verified", isProfileFilled: true };
    if (query) {
      filter.$or = [{ name: { $regex: query, $options: "i" } }, { "profile.companyName": { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }];
    }
    if (category?.length) filter["profile.categories"] = { $in: category };
    if (services?.length) filter["profile.services"] = { $in: services };
    if (companySize) filter["profile.companySize"] = companySize;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter["profile.consultationFee"] = {};
      if (minPrice !== undefined) filter["profile.consultationFee"].$gte = minPrice;
      if (maxPrice !== undefined) filter["profile.consultationFee"].$lte = maxPrice;
    }
    if (minExperience !== undefined) filter["profile.establishedYear"] = { $lte: currentYear - minExperience };
    const sort: any = {};
    if (sortBy) {
      if (sortBy === "experience") sort["profile.establishedYear"] = sortOrder === "asc" ? -1 : 1;
      else if (sortBy === "price") sort["profile.consultationFee"] = sortOrder === "asc" ? 1 : -1;
      else sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else sort.createdAt = -1;
    const [companies, total] = await Promise.all([this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(), this.model.countDocuments(filter)]);
    const resolvedData = await Promise.all((companies as any[]).map(async (c: any) => this._mapToCompany(c)));
    return { companies: resolvedData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateSubscription(companyId: string, subscription: any): Promise<void> {
    const isSubscribed = subscription.status === "active";
    await this.model.findByIdAndUpdate(companyId, { $set: { subscription, isSubscribed } });
  }

  async findCompanyById(id: string): Promise<ICompany | null> {
    const found = await this.model.findById(id).lean();
    if (!found) return null;
    return this._mapToCompany(found);
  }

  private async _mapToCompany(doc: any): Promise<ICompany> {
    return {
      id: doc._id.toString(), 
      name: doc.name, 
      email: doc.email, 
      phone: doc.phone ?? null, 
      role: doc.role, 
      status: doc.status,
      documents: doc.documents, 
      documentStatus: doc.documentStatus, 
      rejectionReason: doc.rejectionReason ?? null,
      location: doc.companyLocation ?? null, 
      isBlocked: doc.isBlocked, 
      isProfileFilled: doc.isProfileFilled,
      isSubscribed: doc.isSubscribed, 
      walletBalance: doc.walletBalance || 0,
      subscription: doc.subscription ? { ...doc.subscription, planId: doc.subscription.planId?.toString(), status: doc.subscription.status || "none" } : undefined,
      profile: await this._resolveProfileUrls(doc.profile),
    };
  }

  async update(id: string, updates: Partial<ICompany>): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }

  async updateDocuments(email: string, docs: any): Promise<ICompany> {
    const updated = await this.model.findOneAndUpdate({ email }, { $set: { documents: docs, documentStatus: "pending" } }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }

  async updateDocumentStatus(params: { email?: string; companyId?: string }, status: any, reason?: string): Promise<ICompany> {
    const query = params.companyId ? { _id: params.companyId } : { email: params.email };
    const updated = await this.model.findOneAndUpdate(query, { $set: { documentStatus: status, rejectionReason: reason || null } }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }
}
