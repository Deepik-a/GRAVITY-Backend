// src/domain/repositories/IAuthRepository.ts
import { UserSignUp, GoogleSignUp, UserProfile } from "../entities/User.js";

export interface IAuthRepository {
  // local signup (create a user/company/admin)
  create(user: UserSignUp): Promise<UserSignUp>;

  // local login (must include password)
  findByEmail(email: string): Promise<UserSignUp | null>;

  // update local password
  updatePassword(email: string, hashedPassword: string): Promise<void>;

  // google flows
  createWithGoogle(user: GoogleSignUp): Promise<GoogleSignUp>;
  findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null>;
  findByGoogleId(googleId: string): Promise<GoogleSignUp | null>;

  // profile flows (shared)
  findById(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
}


