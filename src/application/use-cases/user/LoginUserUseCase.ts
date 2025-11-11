import bcrypt from "bcryptjs";
import type { IJwtService } from "../../../domain/services/IJWTService.js";
import { UserResponseDTO } from "../../dtos/UserSignUpDTO.js";

export class LoginUserUseCase {
  constructor(
    private readonly repository: { findByEmail(email: string): Promise<any> },
    private readonly jwtService: IJwtService,
    private readonly role: "user" | "company" | "admin"
  ) {}

  async execute({ email, password }: { email: string; password: string }) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    console.log(`[LoginUserUseCase] Role: ${this.role}, Email: ${email}`);

    const user = await this.repository.findByEmail(email);
    if (!user) {
      console.error(`[LoginUserUseCase] ${this.role} not found for email: ${email}`);
      throw new Error(`${this.role} not found`);
    }

    if (user.role && user.role !== this.role) {
      throw new Error("Invalid role for this login");
    }

    if (this.role === "company" && user.status !== "verified") {
      throw new Error("Company not verified yet. Please wait for approval.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    const accessToken = this.jwtService.signAccessToken({
      userId: user.id.toString(),
      role: this.role,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      userId: user.id.toString(),
      role: this.role,
    });

    const safeUser = new UserResponseDTO(
      user.id.toString(),
      user.name,
      user.email,
      user.phone
    );

    return {
      message: "Login successful",
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }
}
