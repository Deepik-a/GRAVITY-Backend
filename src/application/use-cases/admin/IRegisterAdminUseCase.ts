import { Admin } from "../../../domain/entities/Admin.js";

export interface IRegisterAdminUseCase {
  execute(admin: Admin): Promise<Admin>;
}