//** A repository interface defines a contract for databse operation,but does not implement it */
//** it should not include dtos and mappers,only entities */

import { GoogleSignUp, UserSignUp,UserProfile } from "../entities/User.js";
import { UniqueEntityID } from "../value-objects/UniqueEntityID.js"

// Internal type including password for login validation
export interface UserWithPassword {
    _id: UniqueEntityID;
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface IUserRepository {
    create(user: UserSignUp): Promise<UserSignUp>; // safe for client
    findByEmail(email: string): Promise<UserWithPassword | null>; // includes password for login
    updatePassword(email:string,hashedPassword:string):Promise<void>
    createWithGoogle(user:GoogleSignUp):Promise<GoogleSignUp>
    findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null>;
    findByGoogleId(googleId: string): Promise<GoogleSignUp | null>; // is there an existing user by their Google ID

    //profile section
    findById(userId: string): Promise<UserProfile | null>;
    updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
}
