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
import { FilterQuery } from "mongoose";

interface GetCompaniesParams {
  page?: number;
  limit?: number;
  query?: string;
  category?: string[];
  services?: string[];
  companySize?: string;
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface MongoFilter {
  isBlocked?: boolean;
  documentStatus?: string;
  isProfileFilled?: boolean;
  $or?: Record<string, unknown>[];
  [key: string]: unknown;
}

type MongoSort = Record<string, 1 | -1>;

@injectable()
export class CompanyRepository
  implements IAuthRepository, ICompanyRepository
{
  private readonly model = CompanyModel;

  constructor(
      @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
      @inject(TYPES.Logger) private readonly _logger: ILogger,
  ) {}

  private async _resolveAssetUrl(path?: string | null): Promise<string | undefined> {
    if (!path) return undefined;
    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) {
      return path;
    }
    try {
      return await this._s3Service.getSignedUrl(path);
    } catch (err) {
      this._logger.error(`// Failed to resolve asset URL: ${path}`, { error: err });
      return path;
    }
  }

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
            this._logger.error(`// Failed to resolve ${key}`, { error: err });
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

  private _stripSignedUrls(profile: unknown): Record<string, unknown> | null {
    if (!profile) return null;
    const stripped = JSON.parse(JSON.stringify(profile));
    const extractKey = (url: string | undefined): string | undefined => {
      if (!url || !url.startsWith("http") || url.startsWith("data:")) return url;
      try { 
        return new URL(url).pathname.substring(1).split("?")[0]; 
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
      stripped.teamMembers = stripped.teamMembers.map((m: Record<string, unknown>) => ({ ...m, photo: extractKey(m.photo as string | undefined) }));
    }
    if (stripped.projects) {
      stripped.projects = stripped.projects.map((p: Record<string, unknown>) => ({ ...p, beforeImage: extractKey(p.beforeImage as string | undefined), afterImage: extractKey(p.afterImage as string | undefined) }));
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
    const doc = created as {
      _id: { toString: () => string };
      name: string;
      email: string;
      password?: string;
      provider: "local" | "google";
      phone?: string;
      status: "pending" | "verified";
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
    };
    return new UserSignUp(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.password || "", 
        "company", 
        doc.provider, 
        doc.phone || "", 
        doc.status, 
        doc.documentStatus, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email }).exec();
    if (!found) return null;
    const doc = found as {
      _id: { toString: () => string };
      name: string;
      email: string;
      password?: string;
      role: "user" | "company";
      provider: "local" | "google";
      phone?: string;
      status: "pending" | "verified";
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
    };
    return new UserSignUp(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        doc.password || "", 
        doc.role, 
        doc.provider, 
        doc.phone || "", 
        doc.status, 
        doc.documentStatus, 
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
    const doc = created as {
      name: string;
      email: string;
      googleId?: string;
      status: "pending" | "verified";
      _id: { toString: () => string };
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
    };
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        doc.status, 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ email, provider: "google" }).exec();
    if (!found) return null;
    const doc = found as {
      name: string;
      email: string;
      googleId?: string;
      status: "pending" | "verified";
      _id: { toString: () => string };
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
    };
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        doc.status, 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ googleId }).exec();
    if (!found) return null;
    const doc = found as {
      name: string;
      email: string;
      googleId?: string;
      status: "pending" | "verified";
      _id: { toString: () => string };
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
    };
    return new GoogleSignUp(
        doc.name, 
        doc.email, 
        doc.googleId || "", 
        "company", 
        "google", 
        doc.status, 
        new UniqueEntityID(doc._id.toString()), 
        doc.documentStatus, 
        doc.rejectionReason || "", 
        doc.isBlocked,
        doc.isProfileFilled,
        doc.isSubscribed
    );
  }

  async findById(id: string): Promise<UserProfile | null> {
    const found = await this.model.findById(id).exec();
    if (!found) return null;
    const doc = found as {
      _id: { toString: () => string };
      name: string;
      email: string;
      phone?: string;
      profileImage?: string;
      companyLocation?: string;
      bio?: string;
      role: "user" | "company";
      status: "pending" | "verified";
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string;
      isBlocked: boolean;
      isProfileFilled: boolean;
      isSubscribed: boolean;
      walletBalance?: number;
    };
    return new UserProfile(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        await this._resolveAssetUrl(doc.profileImage || undefined), 
        doc.phone || undefined, 
        doc.companyLocation || undefined, 
        doc.bio || undefined, 
        doc.isBlocked, 
        doc.role,
        undefined, // bookingCount
        doc.walletBalance
    );
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!updated) return null;
    const doc = updated as {
      _id: { toString: () => string };
      name: string;
      email: string;
      profileImage?: string;
      phone?: string;
      companyLocation?: string;
      bio?: string;
      isBlocked: boolean;
      role: "user" | "company";
      walletBalance?: number;
    };
    return new UserProfile(
        new UniqueEntityID(doc._id.toString()), 
        doc.name, 
        doc.email, 
        await this._resolveAssetUrl(doc.profileImage || undefined), 
        doc.phone || undefined, 
        doc.companyLocation || undefined, 
        doc.bio || undefined,
        doc.isBlocked,
        doc.role,
        undefined, // bookingCount
        doc.walletBalance
    );
  }

  async save(company: ICompany): Promise<ICompany> {
    const updated = await this.model.findOneAndUpdate({ email: company.email }, { $set: company }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }

  async getAllCompanies(): Promise<ICompany[]> {
    const companies = await this.model.find().lean();
    return await Promise.all(companies.map(async (c: Record<string, unknown>) => this._mapToCompany(c)));
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

  async getCompanies(params: GetCompaniesParams): Promise<{ companies: ICompany[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 10, query, category, services, companySize, minPrice, maxPrice, minExperience, sortBy, sortOrder = "desc" } = params;
    const skip = (page - 1) * limit;
    const currentYear = new Date().getFullYear();
    const filter: MongoFilter = { isBlocked: false, documentStatus: "verified", isProfileFilled: true };
    if (query) {
      filter.$or = [{ name: { $regex: query, $options: "i" } }, { "profile.companyName": { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }];
    }
    if (category?.length) filter["profile.categories"] = { $in: category };
    if (services?.length) filter["profile.services"] = { $in: services };
    if (companySize) filter["profile.companySize"] = companySize;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter["profile.consultationFee"] = {};
      if (minPrice !== undefined) (filter["profile.consultationFee"] as Record<string, unknown>).$gte = minPrice;
      if (maxPrice !== undefined) (filter["profile.consultationFee"] as Record<string, unknown>).$lte = maxPrice;
    }
    if (minExperience !== undefined && minExperience !== null) filter["profile.establishedYear"] = { $lte: currentYear - minExperience };
    const sort: MongoSort = {};
    if (sortBy) {
      if (sortBy === "experience") sort["profile.establishedYear"] = sortOrder === "asc" ? -1 : 1;
      else if (sortBy === "price") sort["profile.consultationFee"] = sortOrder === "asc" ? 1 : -1;
      else sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else sort.createdAt = -1;
    const [companies, total] = await Promise.all([this.model.find(filter as FilterQuery<unknown>).sort(sort).skip(skip).limit(limit).lean(), this.model.countDocuments(filter as FilterQuery<unknown>)]);
    const resolvedData = await Promise.all((companies as Record<string, unknown>[]).map(async (c) => this._mapToCompany(c)));
    return { companies: resolvedData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateSubscription(companyId: string, subscription: Record<string, unknown>): Promise<void> {
    const isSubscribed = subscription.status === "active";
    await this.model.findByIdAndUpdate(companyId, { $set: { subscription, isSubscribed } });
  }

  async findCompanyById(id: string): Promise<ICompany | null> {
    const found = await this.model.findById(id).lean();
    if (!found) return null;
    return this._mapToCompany(found);
  }

  private async _mapToCompany(doc: Record<string, unknown>): Promise<ICompany> {
    const d = doc as {
      _id: { toString: () => string };
      name: string;
      email: string;
      phone?: string | null;
      role: "user" | "company";
      status: "verified" | "pending";
      documents?: { GST_Certificate?: string | null; RERA_License?: string | null; Trade_License?: string | null };
      documentStatus: "pending" | "verified" | "rejected";
      rejectionReason?: string | null;
      companyLocation?: string | null;
      isBlocked?: boolean;
      isProfileFilled?: boolean;
      isSubscribed?: boolean;
      walletBalance?: number;
      subscription?: { planId?: { toString: () => string }; status?: "active" | "expired" | "cancelled" | "none" };
      profile?: unknown;
    };
    return {
      id: d._id.toString(), 
      name: d.name, 
      email: d.email, 
      phone: d.phone ?? null, 
      role: d.role, 
      status: d.status,
      documents: {
        GST_Certificate: await this._resolveAssetUrl(d.documents?.GST_Certificate ?? undefined) ?? null,
        RERA_License: await this._resolveAssetUrl(d.documents?.RERA_License ?? undefined) ?? null,
        Trade_License: await this._resolveAssetUrl(d.documents?.Trade_License ?? undefined) ?? null,
      },
      documentStatus: d.documentStatus, 
      rejectionReason: d.rejectionReason ?? null,
      location: d.companyLocation ?? null, 
      isBlocked: d.isBlocked, 
      isProfileFilled: d.isProfileFilled,
      isSubscribed: d.isSubscribed, 
      walletBalance: d.walletBalance || 0,
      subscription: d.subscription ? { ...d.subscription, planId: d.subscription.planId?.toString(), status: (d.subscription.status || "none") as "active" | "expired" | "cancelled" | "none" } : undefined,
      profile: await this._resolveProfileUrls(d.profile),
    };
  }

  async update(id: string, updates: Partial<ICompany>): Promise<ICompany | null> {
    const updated = await this.model.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!updated) return null;
    return this._mapToCompany(updated);
  }

  async updateDocuments(email: string, docs: Record<string, unknown>): Promise<ICompany> {
    const updated = await this.model.findOneAndUpdate({ email }, { $set: { documents: docs, documentStatus: "pending" } }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }

  async updateDocumentStatus(params: { email?: string; companyId?: string }, status: string, reason?: string): Promise<ICompany> {
    const query = params.companyId ? { _id: params.companyId } : { email: params.email };
    const updated = await this.model.findOneAndUpdate(query, { $set: { documentStatus: status, rejectionReason: reason || null } }, { new: true }).lean();
    if (!updated) throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    return this._mapToCompany(updated);
  }
}
