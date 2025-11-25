// src/infrastructure/repositories/CompanyRepository.ts
import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import CompanyModel from "../database/models/CompanyModel.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { UserSignUp, GoogleSignUp, UserProfile } from "../../domain/entities/User.js";
import { ICompany } from "../../domain/entities/Company.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import { IStorageService } from "../../domain/services/IStorageService.js";
import { S3StorageService } from "../services/S3StorageService.js";
import { ObjectId } from "mongodb";
  

export class CompanyRepository
  extends BaseRepository<typeof CompanyModel.prototype>
  implements IAuthRepository, ICompanyRepository
{
  constructor(
    companyModel = CompanyModel, // default
    private readonly _s3Service?: S3StorageService // optional
  ) {
    super(companyModel); // ✅ required call to BaseRepository
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

  async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email });
    if (!found) return null;

    return new UserSignUp(
      new UniqueEntityID(found._id),
      found.name,
      found.email,
      found.password,
      found.role,
      found.provider,
      found.phone,
      found.status
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
    });

    return new GoogleSignUp(
      created.name,
      created.email,
      created.googleId!,
      created.role,
      created.provider,
      created.status
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ email, googleId: { $ne: null } });
    if (!found) return null;

    return new GoogleSignUp(
      found.name,
      found.email,
      found.googleId!,
      found.role,
      "google",
      found.status
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ googleId, provider: "google" });
    if (!found) return null;

    return new GoogleSignUp(
      found.name,
      found.email,
      found.googleId!,
      found.role,
      found.provider,
      found.status
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

  // -------------------------------------------
  // 💠 COMPANY METHODS (from ICompanyRepository)
  // -------------------------------------------

 
 // Update documents using email
async updateDocuments(
  email: string,
  docs: {
    GST_Certificate?: string | null;
    RERA_License?: string | null;
    Trade_License?: string | null;
  }
): Promise<ICompany> {
  const updated = await CompanyModel.findOneAndUpdate(
    { email }, // ✅ match by email instead of _id
    {
      $set: {
        "documents.GST_Certificate": docs.GST_Certificate,
        "documents.RERA_License": docs.RERA_License,
        "documents.Trade_License": docs.Trade_License,
      },
    },
    { new: true }
  ).lean<ICompany>();

  if (!updated) throw new Error("Company not found");

  return updated;
}

// Update document status using email
// Repository Method
async updateDocumentStatus(
  identifier: { email?: string; companyId?: string },
  status: "pending" | "verified" | "rejected"
): Promise<ICompany> {

  // Build dynamic filter
  const filter: any = {};
  if (identifier.email) filter.email = identifier.email;
  if (identifier.companyId) filter._id = identifier.companyId;

  if (Object.keys(filter).length === 0) {
    throw new Error("Must provide email or companyId");
  }

  // Auto-update company.status based on documentStatus
  let derivedStatus: string;

  switch (status) {
    case "verified":
      derivedStatus = "verified";      // Or "verified"
      break;
    case "pending":
      derivedStatus = "pending";
      break;
    case "rejected":
      derivedStatus = "rejected";     // Or "rejected"
      break;
    default:
      derivedStatus = "pending";
  }

  // Update the company
  const updated = await CompanyModel.findOneAndUpdate(
    filter,
    {
      documentStatus: status,
      status: derivedStatus,
    },
    { new: true }
  ).lean();

  if (!updated) throw new Error("Company not found");

  // Return ICompany mapped object
  return {
    id: updated._id.toString(),
    name: updated.name,
    email: updated.email,
    phone: updated.phone ?? null,
    role: updated.role,
    status: updated.status,
    documentStatus: updated.documentStatus,
    documents: {
      GST_Certificate: updated.documents?.GST_Certificate ?? null,
      RERA_License: updated.documents?.RERA_License ?? null,
      Trade_License: updated.documents?.Trade_License ?? null,
    },
  };
}



// Save or update a company
async save(company: ICompany): Promise<ICompany> {
  const updated = await CompanyModel.findOneAndUpdate(
    { email: company.email },
    { $set: company },
    { new: true }
  ).lean<ICompany>();

  if (!updated) throw new Error("Company not found");
  return updated;
}

async getAllCompanies(): Promise<ICompany[]> {
  const companiesFromDb = await this.model.find().lean();

  if (!this._s3Service) {
    return companiesFromDb.map((c) => ({
     id: (c._id as ObjectId).toString(),
      name: c.name,
      email: c.email,
      phone: c.phone ?? null,
      role: c.role,
      status: c.status,
      documents: {
        GST_Certificate: (c.documents?.GST_Certificate as unknown as string) ?? null,
        RERA_License: (c.documents?.RERA_License as unknown as string) ?? null,
        Trade_License: (c.documents?.Trade_License as unknown as string) ?? null,
      },
      documentStatus: c.documentStatus,
    }));
  }

  // Map signed URLs
  return await Promise.all(
    companiesFromDb.map(async (c) => ({
       id: (c._id as ObjectId).toString(),
      name: c.name,
      email: c.email,
      phone: c.phone ?? null,
      role: c.role,
      status: c.status,
      documents: {
        GST_Certificate: c.documents?.GST_Certificate
          ? await this._s3Service!.getSignedUrl(c.documents.GST_Certificate as unknown as string)
          : null,
        RERA_License: c.documents?.RERA_License
          ? await this._s3Service!.getSignedUrl(c.documents.RERA_License as unknown as string)
          : null,
        Trade_License: c.documents?.Trade_License
          ? await this._s3Service!.getSignedUrl(c.documents.Trade_License as unknown as string)
          : null,
      },
      documentStatus: c.documentStatus,
    }))
  );
}

}
