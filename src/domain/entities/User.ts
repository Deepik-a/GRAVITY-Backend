import { UniqueEntityID } from "../value-objects/UniqueEntityID.js";

export interface UserSignUpDetails {
  id?: UniqueEntityID;
  name: string;
  email: string;
  password: string;
  role: "user" | "company" | "admin";
  phone?: string;
  status?: "pending" | "verified";
}


export interface GoogleSignUpDetails {
  name: string;
  email: string;
  googleId: string;
  role: "user" | "company" | "admin";
  status?: "pending" | "verified";
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
}



//Entity for Local Authentication
export class UserSignUp implements UserSignUpDetails {
  constructor(
    public id: UniqueEntityID,
    public name: string,
    public email: string,
    public password: string,
    public role: "user" | "company" | "admin",
    public phone?: string,        // optional → move down
    public status?: "pending" | "verified" // optional → move down
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
    public role: "user" | "company" | "admin",
    public status?: "pending" | "verified"
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
    public bio?: string
  ) {}
}
