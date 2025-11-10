import { UniqueEntityID } from "../value-objects/UniqueEntityID.js";

export interface UserSignUpDetails{
    name:string,
    email:string,
    phone:string,
    password:string;
}

export interface GoogleSignUpDetails {
  name: string;
  email: string;
  googleId: string;
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
export class UserSignUp implements UserSignUpDetails{
constructor(
    public name:string,
    public email:string,
    public phone:string,
    public password: string,// optional for Google users
)
{}
}


//Entity for google Authentication 
export class GoogleSignUp implements GoogleSignUpDetails {
  constructor(
    public name: string,
    public email: string,
    public googleId: string,
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
