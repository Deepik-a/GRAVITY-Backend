import bcrypt from "bcryptjs";
import type { IJwtService } from "@/domain/services/IJWTService";
import type { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import type { IAdminRepository } from "@/domain/repositories/IAdminRepository";
import { Messages } from "@/shared/constants/message";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { LoginRequestDto, LoginResponseDto } from "@/application/dtos/AuthDTOs";

interface AuthenticatableUser {
  id: string | { toString(): string };
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  documentStatus?: string;
  rejectionReason?: string | null;
  isBlocked?: boolean;
  isProfileFilled?: boolean;
  provider?: string;
}

interface LoginInput extends LoginRequestDto {
  repo: IAuthRepository | IAdminRepository;
  role: "user" | "company" | "admin";
  user: AuthenticatableUser; // Input from controller (Existing User)
}

@injectable()
export class LoginUserUseCase {

  constructor(@inject(TYPES.JwtService) private readonly _jwtService: IJwtService) {}

  async execute({ email, password, repo, role }: LoginInput): Promise<LoginResponseDto> {
    if (!password) throw new AppError("Password is required", StatusCode.BAD_REQUEST);

    // 1️⃣ FRESH CHECK: Always fetch latest data from DB to get current status
    // Input-ൽ നിന്ന് കിട്ടുന്ന 'user' ഒബ്‌ജക്റ്റിനെ ആശ്രയിക്കാതെ നേരിട്ട് സെർച്ച് ചെയ്യുന്നു
    const freshUser = await (repo as IAuthRepository).findByEmail(email) as unknown as AuthenticatableUser;
    
    if (!freshUser) {
      throw new AppError("User not found", StatusCode.NOT_FOUND);
    }

    // ⛔ BLOCK CHECK: Using fresh data from database
    if (freshUser.isBlocked) {
      throw new AppError(Messages.AUTH.ACCOUNT_BLOCKED, StatusCode.FORBIDDEN);
    }

    // 4️⃣ PROVIDER & PASSWORD VALIDATION
if (freshUser.provider === "google" && !freshUser.password) {
  throw new AppError(
   Messages.AUTH.GOOGLE_USER_LOGIN,
    StatusCode.BAD_REQUEST
  );
}

if (!freshUser.password) {
  throw new AppError(
Messages.AUTH.No_PASSWORD,
    StatusCode.UNAUTHORIZED
  );
}


    // 2️⃣ ROLE CHECK
    if (freshUser.role !== role) {
      throw new AppError("Invalid role for this login", StatusCode.FORBIDDEN);
    }

    // 3️⃣ ADMIN LOGIN HANDLER
    if (role === "admin") {
      return this._handleAdminLogin(freshUser as AuthenticatableUser, password, repo as IAdminRepository);
    }

    // 4️⃣ PASSWORD VALIDATION (for User & Company)
    const isPasswordValid = await bcrypt.compare(password, freshUser.password);
    if (!isPasswordValid) {
      throw new AppError("Invalid password", StatusCode.UNAUTHORIZED);
    }

    const subjectId = freshUser.id.toString();

    // 5️⃣ JWT GENERATION
    const accessToken = this._jwtService.signAccessToken({
      userId: subjectId,
      role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      userId: subjectId,
      role,
    });

    return {
      message: Messages.AUTH.LOGIN_SUCCESS,
      user: {
        id: subjectId,
        name: freshUser.name,
        email: freshUser.email,
        phone: freshUser.phone || "",
        isProfileFilled: freshUser.isProfileFilled,
      },
      role,
      accessToken,
      refreshToken,
      documentStatus: freshUser.documentStatus,
      rejectionReason: freshUser.rejectionReason,
    };
  }

  private async _handleAdminLogin(
    admin: AuthenticatableUser,
    password: string,
    adminRepo: IAdminRepository
  ) {
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) throw new AppError("Invalid admin password", StatusCode.UNAUTHORIZED);

    const accessToken = this._jwtService.signAccessToken({
      id: admin.id.toString(),
      role: admin.role,
    });

    const refreshToken = this._jwtService.signRefreshToken({
      id: admin.id.toString(),
      role: admin.role,
    });

    await adminRepo.saveRefreshToken(admin.id.toString(), refreshToken);

    return {
      message: Messages.AUTH.ADMIN_LOGIN_SUCCESS,
      role: "admin",
      accessToken,
      refreshToken,
      user: {
        id: admin.id.toString(),
        name: "Admin",
        email: admin.email,
        phone: "",
      }
    };
  }
}