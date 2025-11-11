import { Types } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import UserModel from "../database/models/UserModel.js";
import { IUserRepository, UserWithPassword } from "../../domain/repositories/IUserRepository.js";
import { UserSignUp, GoogleSignUp, UserProfile } from "../../domain/entities/User.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";

export class UserRepository
  extends BaseRepository<typeof UserModel.prototype>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  // 🟩 Create local user
// 🟩 Create local user
async createUser(user: UserSignUp): Promise<UserSignUp> {
  const created = await this.create({
    name: user.name,
    email: user.email,
    phone: user.phone,
    password: user.password,
    provider: "local",
    role: user.role,
    status: user.status ?? "pending",
  });

  return new UserSignUp(
    new UniqueEntityID(created._id), // ✅ MongoDB ObjectId → UniqueEntityID
    created.name,
    created.email,
    created.phone,
    created.password,
    created.role as "user" | "company" | "admin",
    created.status
  );
}


  // 🟩 Find user (for login/forgot password)
// 🟩 Find user (for login/forgot password)
async findByEmail(email: string): Promise<UserSignUp | null> {
  const found = await this.model.findOne({ email, provider: "local" }).exec();
  if (!found) return null;

  return new UserSignUp(
    new UniqueEntityID(found._id), // ✅ consistent naming
    found.name,
    found.email,
    found.phone ?? "",
    found.password,
    found.role as "user" | "company" | "admin",
    found.status
  );
}



  // 🟦 Update password
  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const result = await this.model.updateOne(
      { email, provider: "local" },
      { $set: { password: hashedPassword } }
    );
    if (result.matchedCount === 0) throw new Error("User not found");
  }

  // 🟨 Google Users
  async createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp> {
    const created = await this.create({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      provider: "google",
      role: user.role,
      status: user.status,
    });
    return new GoogleSignUp(created.name, created.email, created.googleId!, user.role, user.status);
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ googleId, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(record.name, record.email, record.googleId!, record.role, record.status);
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const record = await this.model.findOne({ email, provider: "google" }).exec();
    if (!record) return null;
    return new GoogleSignUp(record.name, record.email, record.googleId!, record.role, record.status);
  }

  // 🟩 Get profile
  async findById(userId: string): Promise<UserProfile | null> {
    const user = Types.ObjectId.isValid(userId)
      ? await this.model.findById(userId).exec()
      : await this.model.findOne({ googleId: userId }).exec();

    if (!user) return null;

    return new UserProfile(
      new UniqueEntityID(user._id.toString()),
      user.name,
      user.email,
      user.profileImage ?? undefined,
      user.phone ?? undefined,
      user.location ?? undefined,
      user.bio ?? undefined
    );
  }

  // 🟦 Update profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const updated = Types.ObjectId.isValid(userId)
      ? await this.model.findByIdAndUpdate(userId, { $set: updates }, { new: true }).exec()
      : await this.model.findOneAndUpdate({ googleId: userId }, { $set: updates }, { new: true }).exec();

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
