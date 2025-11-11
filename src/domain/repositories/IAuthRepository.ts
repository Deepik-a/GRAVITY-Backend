import { UserSignUp, GoogleSignUp, UserProfile } from "../entities/User.js";

export interface IAuthRepository {
     create(user: UserSignUp): Promise<UserSignUp>; // safe for client
     findByEmail(email: string): Promise<UserSignUp | null>; // includes password for login
     updatePassword(email:string,hashedPassword:string):Promise<void>
     createWithGoogle(user:GoogleSignUp):Promise<GoogleSignUp>
     findGoogleUserByEmail(email: string): Promise<GoogleSignUp | null>;
     findByGoogleId(googleId: string): Promise<GoogleSignUp | null>; // is there an existing user by their Google ID
 
     //profile section
     findById(userId: string): Promise<UserProfile | null>;
     updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
}

