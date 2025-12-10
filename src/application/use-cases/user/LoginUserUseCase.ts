import bcrypt from "bcryptjs";
import type { IJwtService } from "../../../domain/services/IJWTService.js";
import { UserResponseDTO } from "../../dtos/UserSignUpDTO.js";
import type { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import type { IAdminRepository } from "../../../domain/repositories/IAdminRepository.js";
import { Messages } from "../../../shared/constants/message.js";

interface LoginInput {
  password: string;
  repo: IAuthRepository | IAdminRepository;
  role: "user" | "company" | "admin";
  user: AuthenticatableUser; 
}
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
interface AuthenticatableUser {
  id: string | { toString(): string };
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  documentStatus?: string;
  rejectionReason?: string;
}

@injectable()
export class LoginUserUseCase {
  constructor(  @inject(TYPES.JwtService) private readonly _jwtService: IJwtService) {}

  async execute({ password, repo, role, user }: LoginInput) {
    if (!password) throw new Error("Password is required");

    // 1️⃣ Check role consistency
    if (user.role !== role) {
      throw new Error("Invalid role for this login");
    }

    // 2️⃣ ADMIN LOGIN (special logic)
    if (role === "admin") {
      return this._handleAdminLogin(user as AuthenticatableUser, password, repo as IAdminRepository);
    }

  

    // 4️⃣ Validate password for USER & COMPANY
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    const subjectId = user.id.toString();

    const accessToken = this._jwtService.signAccessToken({
      userId: subjectId,
      role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      userId: subjectId,
      role,
    });

    // 5️⃣ Safe User DTO
    const safeUser = new UserResponseDTO(
      subjectId,
      user.name,
      user.email,
      user.phone || ""
    );

    return {
      message: Messages.AUTH.LOGIN_SUCCESS,
      user: safeUser,
      role,
      accessToken,
      refreshToken,
      documentStatus: user.documentStatus,
      rejectionReason: user.rejectionReason,
    };
  }

  // 🔥 ADMIN LOGIN HANDLER (same as your previous AdminLoginUseCase)
  private async _handleAdminLogin(
    admin: AuthenticatableUser,
    password: string,
    adminRepo: IAdminRepository
  ) {
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error("Invalid admin password");

    const accessToken = this._jwtService.signAccessToken({
      id: admin.id.toString(),
      role: admin.role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id.toString(),
      role: admin.role,
    });

    // Save refresh token only for admin
    await adminRepo.saveRefreshToken(admin.id.toString(), refreshToken);

    return {
      message: Messages.AUTH.ADMIN_LOGIN_SUCCESS,
      role: "admin",
      accessToken,
      refreshToken,
      admin: {
        id: admin.id.toString(),
        email: admin.email,
      },
    };
  }
}
