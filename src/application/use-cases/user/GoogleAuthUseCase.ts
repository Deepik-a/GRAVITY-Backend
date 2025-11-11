// src/application/use-cases/auth/GoogleAuthUseCase.ts
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { GoogleSignUp } from "../../../domain/entities/User.js";
import { GoogleUserMapper } from "../../mappers/GoogleUserMapper.js";
import { IJwtService } from "../../../domain/services/IJWTService.js";

export class GoogleAuthUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: IJwtService,
    private readonly role: "user" | "company" | "admin"
  ) {}

  async execute(googleUser: GoogleSignUp) {
    // 1️⃣ Check existing user
    const byGoogleId = await this.userRepository.findByGoogleId(googleUser.googleId);
    const byEmail = await this.userRepository.findGoogleUserByEmail(googleUser.email);

    const existingUser: GoogleSignUp | null = byGoogleId || byEmail;

    let user: GoogleSignUp;
    if (existingUser) {
      user = existingUser;
    } else {
      const role = googleUser.role || this.role;
      const status = role === "company" ? "pending" : "verified";

      const newUser = new GoogleSignUp(
        googleUser.name,
        googleUser.email,
        googleUser.googleId,
        role,
        status
      );

      user = await this.userRepository.createWithGoogle(newUser);
    }

    // 2️⃣ Role check
    if (user.role === "company" && user.status !== "verified") {
      throw new Error("Company not verified. Please wait for admin approval.");
    }

    // 3️⃣ Generate tokens
    const accessToken = this.jwtService.signAccessToken({
      userId: user.googleId,
      role: user.role,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      userId: user.googleId,
      role: user.role,
    });

    // 4️⃣ Return DTO
    return {
      user: GoogleUserMapper.toResponseDTO(user,accessToken),
      accessToken,
      refreshToken,
    };
  }
}
