import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { GoogleSignUp, UserSignUp } from "@/domain/entities/User";
import { GoogleUserMapper } from "@/application/mappers/GoogleUserMapper";
import { IJwtService } from "@/domain/services/IJWTService";
import { Messages } from "@/shared/constants/message";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { GoogleAuthRequestDto, GoogleAuthResponseDto } from "@/application/dtos/AuthDTOs";
import { IGoogleAuthUseCase } from "@/application/interfaces/use-cases/user/IGoogleAuthUseCase";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    @inject(TYPES.UserRepository) private readonly _userRepository: IAuthRepository,
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: IAuthRepository,
    @inject(TYPES.JwtService) private readonly _jwtService: IJwtService
  ) {}

  async execute(dto: GoogleAuthRequestDto): Promise<GoogleAuthResponseDto> {
    const { googleUser, repo, existingUser, frontendRole } = dto;

    let user: UserSignUp | GoogleSignUp = existingUser as UserSignUp | GoogleSignUp;
    let finalRepo: IAuthRepository | null = repo || null;
    let isNewUser = false;

    // 1. FRESH SEARCH (Always fetch from DB to get the latest Block Status)
    const [userByEmail, companyByEmail] = await Promise.all([
      this._userRepository.findGoogleUserByEmail(googleUser.email),
      this._companyRepository.findGoogleUserByEmail(googleUser.email),
    ]);

    const freshUser = userByEmail || companyByEmail;

    if (freshUser) {
      user = freshUser; // freshUser
      finalRepo = userByEmail ? this._userRepository : this._companyRepository;
    }

    // 2. CREATE NEW USER IF NOT FOUND AT ALL
    if (!user) {
      if (!frontendRole) {
        throw new AppError("Role is required for first-time signup", StatusCode.BAD_REQUEST);
      }

      finalRepo = frontendRole === "company" ? this._companyRepository : this._userRepository;
      const status = frontendRole === "company" ? "pending" : "verified";

      const newUser = new GoogleSignUp(
        googleUser.name,
        googleUser.email,
        googleUser.googleId,
        frontendRole,
        "google",
        status
      );

      user = await finalRepo.createWithGoogle(newUser);
      isNewUser = true;
    } else {
      // If user exists but name is missing, update it
      if (!user.name && googleUser.name) {
          (user as { name?: string }).name = googleUser.name;
          if (finalRepo) {
              const userId = (user as { id?: { toString: () => string } }).id?.toString();
              if (userId) {
                  await (finalRepo as { updateUserProfile: (id: string, updates: Record<string, unknown>) => Promise<unknown> }).updateUserProfile(userId, { name: googleUser.name });
              }
          }
      }
    }

    // 3. SAFETY CHECK
    if (!user || !finalRepo) {
      throw new AppError("Authentication failed: User could not be identified.", StatusCode.INTERNAL_ERROR);
    }

    // ⛔ FRESH BLOCK CHECK (This will now use the latest value from DB)
    if (user.isBlocked) {
      throw new AppError(Messages.AUTH.ACCOUNT_BLOCKED, StatusCode.FORBIDDEN);
    }

    // 4. COMPANY VERIFICATION CHECK (Passed to frontend to handle)
    // Removed the check that throws FORBIDDEN for pending documentStatus
    // This allows the frontend to show the "pending" message as requested.


    // 5. GENERATE JWT
    const subject = (user as { id?: string; googleId?: string }).id?.toString() || (user as { googleId: string }).googleId;
    const payload = { 
      userId: subject, 
      role: user.role, 
      status: user.status,
      name: user.name,
      email: user.email
    };

    const accessToken = this._jwtService.signAccessToken(payload);
    const refreshToken = this._jwtService.signRefreshToken(payload);

    // 6. RETURN
    const googleUserDto = GoogleUserMapper.toResponseDTO(user as GoogleSignUp, accessToken);

    return {
      user: googleUserDto,
      accessToken,
      refreshToken,
      isNewUser,
      documentStatus: user.documentStatus,
      rejectionReason: user.rejectionReason,
    };
  }
}