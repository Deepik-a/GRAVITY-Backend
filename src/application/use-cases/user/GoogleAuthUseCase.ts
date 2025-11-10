import jwt from "jsonwebtoken";
import { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { GoogleSignUp } from "../../../domain/entities/User.js";
import { GoogleUserMapper } from "../../mappers/GoogleUserMapper.js";

export class GoogleAuthUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(googleUser: GoogleSignUp) {
    // 1️⃣ Check if user exists
    const byGoogleId = await this.userRepository.findByGoogleId(googleUser.googleId);
    const byEmail = await this.userRepository.findGoogleUserByEmail(googleUser.email);
    const existingUser: GoogleSignUp | null = byGoogleId || byEmail;

    let user: GoogleSignUp;
    if (existingUser) {
      user = existingUser;
    } else {
      const newUser = new GoogleSignUp(
        googleUser.name,
        googleUser.email,
        googleUser.googleId
      );
      user = await this.userRepository.createWithGoogle(newUser);
    }

    // 2️⃣ Generate tokens
    const accessToken = jwt.sign(
      { userId: user.googleId, role: "user" },
      process.env.JWT_ACCESS_SECRET || "access_secret",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.googleId, role: "user" },
      process.env.JWT_REFRESH_SECRET || "refresh_secret",
      { expiresIn: "7d" }
    );

    // 3️⃣ Return mapped DTO + tokens
    const userDTO = GoogleUserMapper.toResponseDTO(user);
    return { user: userDTO, accessToken, refreshToken };
  }
}
