import { IAdminRepository } from "../../../domain/repositories/IAdminRepository";
import bcrypt from "bcryptjs";
import type { IJwtService } from "../../../domain/services/IJWTService.js";
import { IAdminLoginUseCase } from "../../interfaces/use-cases/admin/IAdminLoginUseCase";
import { Messages } from "../../../shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
@injectable()
export class AdminLoginUseCase implements IAdminLoginUseCase {
  constructor(
    @inject(TYPES.AdminRepository) private readonly _adminRepo: IAdminRepository,
     @inject(TYPES.JwtService) private readonly _jwtService: IJwtService
  ) {}

  async execute(email: string, password: string) {
    console.log("🟦 AdminLoginUseCase.execute() called");
    console.log("📩 Email received:", email);
    console.log("📩 Password received (hashed check only, not printing value)");

    // 1. Fetch admin
    const admin = await this._adminRepo.findAdminByEmail(email);
    console.log("🔍 Admin lookup result:", admin ? "FOUND" : "NOT FOUND");

    if (!admin) {
      console.log("❌ No admin found with this email");
      throw new Error("Admin not found");
    }

    console.log("🧾 Stored admin data:", {
      id: admin.id,
      role: admin.role,
      email: admin.email,
    });

    // 2. Check password
    console.log("🔐 Comparing password with stored hash...");
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔐 Password match result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch - invalid credentials");
      throw new Error("Invalid credentials");
    }

    // 3. Sign Access Token
    console.log("🔑 Generating access token...");
    const accessToken = this._jwtService.signAccessToken({
      id: admin.id,
      role: admin.role,
    });
    console.log("🔑 Access Token:", accessToken);

    // 4. Sign Refresh Token
    console.log("🔁 Generating refresh token...");
    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id,
      role: admin.role,
    });
    console.log("🔁 Refresh Token:", refreshToken);

    console.log("✅ Admin login successful");

    return {
      accessToken,
      refreshToken,
      message: Messages.AUTH.ADMIN_LOGIN_SUCCESS,
    };
  }
}

