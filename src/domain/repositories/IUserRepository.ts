//** A repository interface defines a contract for databse operation,but does not implement it */
//** it should not include dtos and mappers,only entities */

// src/domain/repositories/IUserRepository.ts
import { UserProfile } from "@/domain/entities/User";

export interface IUserRepository {
  getAllUsers(): Promise<UserProfile[]>;
  updateBlockStatus(userId: string, isBlocked: boolean): Promise<UserProfile | null>;
}

