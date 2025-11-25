import { IAdminRepository } from "../../../domain/repositories/IAdminRepository";
import bcrypt from "bcryptjs";
import type { IJwtService } from "../../../domain/services/IJWTService.js";
import { IAdminLoginUseCase } from "../../interfaces/use-cases/admin/IAdminLoginUseCase";
import { Messages } from "../../../shared/constants/message";

export class AdminLoginUseCase implements IAdminLoginUseCase {
  constructor(
    private readonly _adminRepo: IAdminRepository,
    private readonly _jwtService: IJwtService
  ) {}

  async execute(email: string, password: string) {
    const admin = await this._adminRepo.findAdminByEmail(email);
    console.log("email of Admin",email)
    if (!admin) throw new Error("Admin not found");

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const accessToken = this._jwtService.signAccessToken({
      id: admin.id,
      role: admin.role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id,
      role: admin.role,
    });

    await this._adminRepo.saveRefreshToken(admin.id, refreshToken);

    return { accessToken, refreshToken,  message: Messages.AUTH.ADMIN_LOGIN_SUCCESS, };
  }
}
