import { UniqueEntityID } from "../value-objects/UniqueEntityID.js";

export interface UserSignUpDetails {
  id?: UniqueEntityID;
  name: string;
  email: string;
  password: string;
  role: "user" | "company" ;
  provider:"local"|"google"
  phone?: string;
  status?: "pending" | "verified";
  documentStatus?: "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
}


export interface GoogleSignUpDetails {
  name: string;
  email: string;
  googleId: string;
  role: "user" | "company" ;
  provider:"local"|"google";
  status?: "pending" | "verified";
  id?: UniqueEntityID;
  documentStatus?: "pending" | "verified" | "rejected";
  rejectionReason?: string | null;
}

//a user is authenticated with basic details,profile is the user's extended information
export interface UserProfileDetails {
  userId: UniqueEntityID;
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  isBlocked?:boolean
}



//Entity for Local Authentication
export class UserSignUp implements UserSignUpDetails {
  constructor(
    public id: UniqueEntityID,
    public name: string,
    public email: string,
    public password: string,
    public role: "user" | "company" ,
    public provider: "local" | "google" = "local",
    public phone: string="",        // optional → move down
  public status: "pending" | "verified", // optional → move down
    public documentStatus?: "pending" | "verified" | "rejected",
    public rejectionReason?: string | null
  ) {}
}

//
// 3️⃣ Entity for Google Authentication
//
export class GoogleSignUp implements GoogleSignUpDetails {
  constructor(
    public name: string,
    public email: string,
    public googleId: string,
    public role: "user" | "company",
    public provider:"local"|"google",
    public status?: "pending" | "verified",
    public id?: UniqueEntityID, // Added ID
    public documentStatus?: "pending" | "verified" | "rejected", // Added
    public rejectionReason?: string | null // Added
  ) {}
}



//Entity for Profile
export class UserProfile implements UserProfileDetails {
  constructor(
    public userId: UniqueEntityID,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string,
    public isBlocked?:boolean
  ) {}
}


//an user that is required to do google login and signup
export interface AuthenticatedUser {
  id: UniqueEntityID;
  name: string;
  email: string;
  role: "user" | "company";
  provider: "local" | "google";
  googleId?: string;   // optional
}
