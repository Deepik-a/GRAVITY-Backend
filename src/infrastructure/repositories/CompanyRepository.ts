
import { BaseRepository } from "./BaseRepository.js";
import CompanyModel from "../database/models/CompanyModel.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { UserSignUp, GoogleSignUp, UserProfile } from "../../domain/entities/User.js";
import { ICompany } from "../../domain/entities/Company.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import { IStorageService } from "../../domain/services/IStorageService.js";
import { ObjectId } from "mongodb";
import { inject, injectable ,unmanaged} from "inversify";
import { TYPES } from "../DI/types.js";
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
        rawData.isBlocked ?? false                  // 11 
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
      created.rejectionReason
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
    found.isBlocked ?? false 
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
      found.rejectionReason
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
          this._logger.info(`🔑 Signed URL generated successfully (short): ${signed.slice(0, 90)}...`);
        } catch (err) {
          this._logger.error(`❌ Failed to generate signed URL for: ${fileKey}`, { error: err });
        }
      }

      return {
        id: (c._id as ObjectId).toString(),
        name: c.name,
        email: c.email,
        phone: c.phone ?? null,
        role: c.role,
        status: c.status,
        documentStatus: c.documentStatus,
        documents: resolvedDocuments,
        rejectionReason: c.rejectionReason,
        isBlocked: c.isBlocked
      };
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
    isBlocked: updated.isBlocked
  };
}
}