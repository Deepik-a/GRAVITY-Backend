import { Types } from "mongoose";
import type { IUserRepository, UserWithPassword } from "../../domain/repositories/IUserRepository.js";
import { UserSignUp, GoogleSignUp, UserProfile } from "../../domain/entities/User.js";
import UserModel from "../database/models/UserModel.js";
import { UniqueEntityID } from "../../domain/value-objects/UniqueEntityID.js";

export class UserRepository implements IUserRepository {
  // 🟩 Create normal user (email + password + phone)
  async create(user: UserSignUp): Promise<UserSignUp> {
    const created = await UserModel.create({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      password: user.password ?? "",
      provider: "local",
    });

    // ✅ Attach UniqueEntityID to domain entity
    const entity = new UserSignUp(
      created.name,
      created.email,
      created.phone ?? "",
      created.password ?? ""
    );
    (entity as any).id = new UniqueEntityID(created._id); // attach domain ID manually

    return entity;
  }

  // 🟩 Find user (for login, forgot password, etc.)
  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const found = await UserModel.findOne({ email, provider: "local" });
    if (!found) return null;

    return {
      _id: new UniqueEntityID(found._id),
      name: found.name,
      email: found.email,
      phone: found.phone ?? "",
      password: found.password ?? "",
    };
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const result = await UserModel.updateOne(
      { email, provider: "local" },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) throw new Error("User not found");
  }

  // 🟨 Google Users
  async createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp> {
    const created = await UserModel.create({
      name: user.name,
      email: user.email,
      googleId: user.googleId,
      provider: "google",
    });

    return new GoogleSignUp(created.name, created.email, created.googleId!);
  }

  async findByGoogleId(googleId: string): Promise<GoogleSignUp | null> {
    const record = await UserModel.findOne({ googleId, provider: "google" });
    if (!record) return null;

    return new GoogleSignUp(record.name, record.email, record.googleId!);
  }

  async findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null> {
    const record = await UserModel.findOne({
      email,
      googleId: { $exists: true },
      provider: "google",
    });
    if (!record) return null;
    return new GoogleSignUp(record.name, record.email, record.googleId!);
  }

// 🟩 Get full user details (for auth + profile)
  async findById(userId: string): Promise<UserProfile | null> {
    console.log("🔍 [Repo] Looking up user with ID:", userId);

    let user;

    // ✅ Handle both ObjectId and Google ID
    if (Types.ObjectId.isValid(userId)) {
      user = await UserModel.findById(userId).select(
        "name email status phone profileImage location bio _id googleId provider"
      );
    } else {
      user = await UserModel.findOne({ googleId: userId }).select(
        "name email status phone profileImage location bio _id googleId provider"
      );
    }

    console.log("🔍 [Repo] Found DB user:", user?._id?.toString(), user?.name);

    if (!user) return null;

    const domainUser = new UserProfile(
      new UniqueEntityID(user._id.toString()),
      user.name,
      user.email,
      user.profileImage ?? undefined,
      user.phone ?? undefined,
      user.location ?? undefined,
      user.bio ?? undefined
    );

    console.log("🧱 [Repo] Returning Domain UserProfile:", domainUser);
    return domainUser;
  }

// 🟦 Update only profile-related fields
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    console.log("✏️ [Repo] Updating profile for ID:", userId);

    let user;

    // ✅ Handle both Mongo _id and Google ID for updates
    if (Types.ObjectId.isValid(userId)) {
      user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: updates },
        {
          new: true,
          projection:
            "name email status phone profileImage location bio _id googleId provider",
        }
      );
    } else {
      user = await UserModel.findOneAndUpdate(
        { googleId: userId },
        { $set: updates },
        {
          new: true,
          projection:
            "name email status phone profileImage location bio _id googleId provider",
        }
      );
    }

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
}

