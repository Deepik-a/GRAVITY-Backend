import { IAdmin } from "@/domain/entities/Admin";
import { IAdmin as IAdminDoc } from "@/infrastructure/database/models/AdminModel";

export const AdminMapper = {
  toDomain(admin: IAdminDoc): IAdmin {
    return {
      id: admin._id.toString(),
      email: admin.email,
      password: admin.password,
      role: admin.role || "admin",
      refreshToken: admin.refreshToken,
    };
  }
};
