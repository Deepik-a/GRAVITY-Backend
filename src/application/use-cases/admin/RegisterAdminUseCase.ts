
import { IRegisterAdminUseCase } from "../../../application/use-cases/admin/IRegisterAdminUseCase.js";
import { IAdminRepository } from "../../../domain/repositories/IAdminRepository.js";
import { Admin } from "../../../domain/entities/Admin.js";

export class RegisterAdminUseCase implements IRegisterAdminUseCase {
  constructor(private adminRepository: IAdminRepository) {}

  async execute(admin: Admin): Promise<Admin> {

    const existing = await this.adminRepository.findByEmail(admin.email);
    if (existing) throw new Error("Admin already exists with this email.");

    return await this.adminRepository.create(admin);
  }
}
