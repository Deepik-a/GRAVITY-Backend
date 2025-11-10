import type { IUserRepository } from "../../../domain/repositories/IUserRepository.js";
import { UserResponseDTO } from "../../dtos/UserSignUpDTO.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserWithPassword } from "../../../domain/repositories/IUserRepository.js";

export class LoginUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ email, password }: { email: string; password: string }) {
    // Step 1️⃣ — Validate input
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Step 2️⃣ — Find user by email
    const user: UserWithPassword | null = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    // Step 3️⃣ — Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    // Step 4️⃣ — Generate Access & Refresh Tokens
    const accessToken = jwt.sign(
      { userId: user._id.toString(), role: "user" },
      process.env.JWT_ACCESS_SECRET || "access_secret",
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString(), role: "user" },
      process.env.JWT_REFRESH_SECRET || "refresh_secret",
      { expiresIn: "7d" }
    );

    // Step 5️⃣ — Return safe DTO for client (exclude password)
    const safeUser = new UserResponseDTO(
      user._id.toObjectId(),  // convert UniqueEntityID → ObjectId
      user.name,
      user.email,
      user.phone
    );

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }
}
