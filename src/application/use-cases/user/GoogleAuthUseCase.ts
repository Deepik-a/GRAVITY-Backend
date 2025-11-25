import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { GoogleSignUp } from "../../../domain/entities/User.js";
import { GoogleUserMapper } from "../../mappers/GoogleUserMapper.js";
import { IJwtService } from "../../../domain/services/IJWTService.js";

export class GoogleAuthUseCase {
  constructor(
    private readonly _userRepository: IAuthRepository,
    private readonly _companyRepository: IAuthRepository,
    private readonly _jwtService: IJwtService
  ) {}
async execute({
  googleUser,
  repo,
  existingUser,
  frontendRole,
}: {
  googleUser: { name: string; email: string; googleId: string };
  repo: IAuthRepository | null;
  existingUser?: any;
  frontendRole?: "user" | "company" | "admin";
}) {

  let user = existingUser;
  let finalRepo = repo;
  let isNewUser = false;

  // ✅ Check if user exists in DB first
  if (!user) {
    const userByEmail = await this._userRepository.findGoogleUserByEmail(googleUser.email);
    const companyByEmail = await this._companyRepository.findGoogleUserByEmail(googleUser.email);

    if (userByEmail) {
      user = userByEmail;
      finalRepo = this._userRepository;
    } else if (companyByEmail) {
      user = companyByEmail;
      finalRepo = this._companyRepository;
    }
  }

  // ✅ If still no user → create new
  if (!user) {
    if (!frontendRole) throw new Error("Role is required for first-time signup");

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
  }

  // ✅ Company verification check
  if (user.role === "company" && user.status !== "verified") {
    return {
      user: GoogleUserMapper.toResponseDTO(user, ""),
      isNewUser,
      isPending: true,
    };
  }

  // ✅ Generate JWT
  const subject = user.id?.toString() || user.googleId;

  const accessToken = this._jwtService.signAccessToken({
    userId: subject,
    role: user.role,
    status: user.status,
  });

  const refreshToken = this._jwtService.signRefreshToken({
    userId: subject,
    role: user.role,
    status: user.status,
  });

  return {
    user: GoogleUserMapper.toResponseDTO(user, accessToken),
    accessToken,
    refreshToken,
    isNewUser,
    isPending: false,
  };
}


}
