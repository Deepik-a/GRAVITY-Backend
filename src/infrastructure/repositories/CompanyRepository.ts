import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import CompanyModel from "../database/models/CompanyModel.js";
import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { UserSignUp, GoogleSignUp, UserProfile } from "../../domain/entities/User.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";

export class CompanyRepository
  extends BaseRepository<typeof CompanyModel.prototype>
  implements IUserRepository
{
  constructor() {
    super(CompanyModel);
  }

  // 🟩 Create local company user
  async createUser(user: UserSignUp): Promise<UserSignUp> {
    const created = await this.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
      provider: "local",
      role: "company", // fixed role for company repo
      status: "pending",
    });

    return new UserSignUp(
      new UniqueEntityID(created._id),
      created.name,
      created.email,
      created.password,
      created.role as "user" | "company" | "admin",
      created.phone ?? "",
      created.status
    );
  }

  // 🟦 Find by email (for login or forgot password)
  async findByEmail(email: string): Promise<UserSignUp | null> {
    const found = await this.model.findOne({ email, provider: "local" }).exec();
    if (!found) return null;

    return new UserSignUp(
      new UniqueEntityID(found._id),
      found.name,
      found.email,
      found.password,
      found.role as "user" | "company" | "admin",
      found.phone ?? "",
      found.status
    );
  }

  // 🟦 Update password
  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const result = await this.model.updateOne(
      { email, provider: "local" },
      { $set: { password: hashedPassword } }
    );
    if (result.matchedCount === 0) throw new Error("Company not found");
  }

  // 🟨 Google signup
  async createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp> {
    const created = await this.create({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      provider: "google",
      role: "company",
      status: "pending",
    });

    return new GoogleSignUp(
      created.name,
      created.email,
      created.googleId!,
      created.role as "user" | "company" | "admin",
      created.status
    );
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ googleId, provider: "google" }).exec();
    if (!found) return null;

    return new GoogleSignUp(
      found.name,
      found.email,
      found.googleId!,
      found.role as "user" | "company" | "admin",
      found.status
    );
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const found = await this.model.findOne({ email, provider: "google" }).exec();
    if (!found) return null;

    return new GoogleSignUp(
      found.name,
      found.email,
      found.googleId!,
      found.role as "user" | "company" | "admin",
      found.status
    );
  }

  // 🟩 Get company profile
  async findById(companyId: string): Promise<UserProfile | null> {
    const company = Types.ObjectId.isValid(companyId)
      ? await this.model.findById(companyId).exec()
      : await this.model.findOne({ googleId: companyId }).exec();

    if (!company) return null;

    return new UserProfile(
      new UniqueEntityID(company._id.toString()),
      company.name,
      company.email,
      company.profileImage ?? undefined,
      company.phone ?? undefined,
      company.location ?? undefined,
      company.bio ?? undefined
    );
  }

  // 🟦 Update company profile
  async updateUserProfile(companyId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = Types.ObjectId.isValid(companyId)
      ? await this.model.findByIdAndUpdate(companyId, { $set: updates }, { new: true }).exec()
      : await this.model.findOneAndUpdate({ googleId: companyId }, { $set: updates }, { new: true }).exec();

    if (!updated) return null;

    return new UserProfile(
      new UniqueEntityID(updated._id.toString()),
      updated.name,
      updated.email,
      updated.profileImage ?? undefined,
      updated.phone ?? undefined,
      updated.location ?? undefined,
      updated.bio ?? undefined
    );
  }
}
