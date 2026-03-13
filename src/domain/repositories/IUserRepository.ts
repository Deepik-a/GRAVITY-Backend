//** A repository interface defines a contract for databse operation,but does not implement it */
//** it should not include dtos and mappers,only entities */

// src/domain/repositories/IUserRepository.ts
import { UserProfile } from "@/domain/entities/User";
import { ICompany } from "@/domain/entities/Company";

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>;
  getAllUsers(): Promise<UserProfile[]>;
  updateBlockStatus(userId: string, isBlocked: boolean): Promise<UserProfile | null>;
  toggleFavourite(userId: string, companyId: string): Promise<string[]>; // Returns updated favourites list
  getFavourites(userId: string): Promise<ICompany[]>; // Returns populated company details
  changePassword(userId: string, hashedPassword: string): Promise<void>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
}

