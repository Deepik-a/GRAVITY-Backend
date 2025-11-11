import { Admin } from "../entities/Admin.js";

export interface IAdminRepository {
  create(admin: Admin): Promise<Admin>;
  findByEmail(email: string): Promise<Admin | null>;
}