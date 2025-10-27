//** A repository interface defines a contract for databse operation,but does not implement it */

import { UserSignUp } from "../entities/User.js";
import { UserResponseDTO } from "../../application/dtos/UserSignUpDTO.js";
import type { ObjectId } from "mongodb";

// Internal type including password for login validation
export interface UserWithPassword {
    _id: ObjectId;
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface IUserRepository {
    create(user: UserSignUp): Promise<UserResponseDTO>; // safe for client
    findByEmail(email: string): Promise<UserWithPassword | null>; // includes password for login
}
