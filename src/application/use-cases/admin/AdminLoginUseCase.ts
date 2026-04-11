import { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import bcrypt from "bcryptjs";
import type { IJwtService } from "@/domain/services/IJWTService";
import { IAdminLoginUseCase } from "@/application/interfaces/use-cases/admin/IAdminLoginUseCase";
import { AdminLoginRequestDto } from "@/application/dtos/admin/AdminLoginRequestDto";
import { AdminLoginResponseDto } from "@/application/dtos/admin/AdminLoginResponseDto";
import { Messages } from "@/shared/constants/message";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ILogger } from "@/domain/services/ILogger";
@injectable()
export class AdminLoginUseCase implements IAdminLoginUseCase {
  constructor(
    @inject(TYPES.AdminRepository) private readonly _adminRepo: IAdminRepository,
    @inject(TYPES.JwtService) private readonly _jwtService: IJwtService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

 
  async execute(dto: AdminLoginRequestDto): Promise<AdminLoginResponseDto> {
    const { email, password } = dto;
 

    // 1. Fetch admin
    const admin = await this._adminRepo.findAdminByEmail(email);

     // 🟢 Log the admin result
  this._logger.info("👤 Admin query result", {
    admin
  });
  

    if (!admin) {
      throw new AppError("admin email wrong", StatusCode.NOT_FOUND);
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new AppError("admin password wrong", StatusCode.UNAUTHORIZED);
    }

    // 3. Sign tokens
    const accessToken = this._jwtService.signAccessToken({
      id: admin.id,
      role: admin.role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id,
      role: admin.role,
    });

  

    return {
      accessToken,
      refreshToken,
      message: Messages.AUTH.ADMIN_LOGIN_SUCCESS,
      user: {
        id: admin.id,
        email: admin.email,
        name: "Admin",
      },
    };
  }
}
