import { IAdminRepository } from "../../domain/repositories/IAdminRepository";
import { IAdmin } from "../../domain/entities/Admin";
import AdminModel from "../database/models/AdminModel";
import { injectable } from "inversify";

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
}
