import { IAdminRepository } from "../../domain/repositories/IAdminRepository.js";
import { Admin } from "../../domain/entities/Admin.js";
import AdminModel  from "../../infrastructure/database/models/AdminModel.js"; // adjust path as needed

export class AdminRepository implements IAdminRepository{


  async create(admin: Admin): Promise<Admin> {
    const created = await AdminModel.create(admin);
  return new Admin(created.name,created.email, created.password);
  }

      async findByEmail(email: string): Promise<Admin | null> {
   return await AdminModel.findOne({ email });
  }
}