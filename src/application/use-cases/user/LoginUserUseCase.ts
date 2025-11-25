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
  user: any; 
}

export class LoginUserUseCase {
  constructor(private readonly _jwtService: IJwtService) {}

  async execute({ password, repo, role, user }: LoginInput) {
    if (!password) throw new Error("Password is required");

    // 1️⃣ Check role consistency
    if (user.role !== role) {
      throw new Error("Invalid role for this login");
    }

    // 2️⃣ ADMIN LOGIN (special logic)
    if (role === "admin") {
      return this._handleAdminLogin(user, password, repo as IAdminRepository);
    }

    // 3️⃣ COMPANY LOGIN → must be verified
    if (role === "company" && user.status !== "verified") {
      throw new Error("Company not verified. Please wait for approval.");
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
      user.phone
    );

    return {
      message: Messages.AUTH.LOGIN_SUCCESS,
      user: safeUser,
      role,
      accessToken,
      refreshToken,
    };
  }

  // 🔥 ADMIN LOGIN HANDLER (same as your previous AdminLoginUseCase)
  private async _handleAdminLogin(
    admin: any,
    password: string,
    adminRepo: IAdminRepository
  ) {
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new Error("Invalid admin password");

    const accessToken = this._jwtService.signAccessToken({
      id: admin.id,
      role: admin.role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id,
      role: admin.role,
    });

    // Save refresh token only for admin
    await adminRepo.saveRefreshToken(admin.id, refreshToken);

    return {
      message: Messages.AUTH.ADMIN_LOGIN_SUCCESS,
      role: "admin",
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    };
  }
}
