import { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import { IAdmin } from "@/domain/entities/Admin";
import AdminModel from "@/infrastructure/database/models/AdminModel";
import { injectable } from "inversify";
import { UserProfile, CompanyProfile } from "@/domain/entities/User";
import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";
import UserModel from "@/infrastructure/database/models/UserModel";
import CompanyModel from "@/infrastructure/database/models/CompanyModel";
import { PaginatedResult } from "@/shared/types/PaginatedResult";

@injectable()
export class AdminRepository implements IAdminRepository {
  // 🔵 DB-LAYER METHOD (for admin-specific operations)
  async findAdminByEmail(email: string): Promise<IAdmin | null> {
    const admin = await AdminModel.findOne({ email });
    if (!admin) return null;

    return {
      id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      role: admin.role,
      refreshToken: admin.refreshToken,
    };
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

    const data = users.map((user) => {
      return new UserProfile(
        new UniqueEntityID(user._id.toString()),
        user.name,
        user.email,
        user.profileImage ?? undefined,
        user.phone ?? undefined,
        user.location ?? undefined,
        user.bio ?? undefined,
        user.isBlocked,
        user.role ?? undefined
      );
    });

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
      CompanyModel.find(filter).skip(skip).limit(limit),
      CompanyModel.countDocuments(filter),
    ]);
    
    return {
      data: companies.map((c) => new CompanyProfile(
        new UniqueEntityID(c._id.toString()),
        c.name,
        c.email,
        c.phone ?? undefined,
        undefined, // location
        c.documentStatus ?? undefined,
        c.isBlocked,
        undefined, // profileImage
        c.documents as Record<string, string | null>
      )),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Nullish Coalescing Operator (??)
  //value ?? defaultValue,if value is null or undefined,return defaultValue

  //Logical OR Operator (||)
  //value || defaultValue,if value is falsy(return false,0,"",null,undefined,NaN),return defaultValue
}
