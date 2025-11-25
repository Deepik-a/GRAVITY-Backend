  import { IAdmin } from "../entities/Admin";

  export interface IAdminRepository {
    findAdminByEmail(email: string): Promise<IAdmin | null>;
    saveRefreshToken(adminId: string, token: string): Promise<void>;
  }
