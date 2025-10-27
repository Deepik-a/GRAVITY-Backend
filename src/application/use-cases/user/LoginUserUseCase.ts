import type { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { UserResponseDTO } from "../../dtos/UserSignUpDTO.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserWithPassword } from "../../../domain/repositories/IUserRepository.js";

export class LoginUserUseCase {

  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }: { email: string; password: string }) {

    // Step 1: Basic validation
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    // Step 2: Find user by email (includes password for validation)
    const user: UserWithPassword | null = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    // Step 3: Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    // Step 4: Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    // Step 5: Return safe DTO for client (exclude password)
    const safeUser = new UserResponseDTO(user._id, user.name, user.email, user.phone);

    return { user: safeUser, token };
  }
}
