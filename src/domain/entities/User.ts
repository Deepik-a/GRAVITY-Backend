import { UniqueEntityID } from "@/domain/value-objects/UniqueEntityID";

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
  isBlocked?: boolean;
  isProfileFilled?: boolean;
  isSubscribed?: boolean;
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
  isBlocked?: boolean;
  isProfileFilled?: boolean;
  isSubscribed?: boolean;
}

//a user is authenticated with basic details,profile is the user's extended information
export interface UserProfileDetails {
  id: UniqueEntityID;
  name: string;
  email: string;
  profileImage?: string;
  phone?: string;
  location?: string;
  bio?: string;
  isBlocked?:boolean;
  role?: string;
  bookingCount?:number;
  walletBalance?:number;
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
    public phone = "",        // optional → move down
  public status: "pending" | "verified", // optional → move down
    public documentStatus?: "pending" | "verified" | "rejected",
    public rejectionReason?: string | null,
    public isBlocked = false,
    public isProfileFilled = false,
    public isSubscribed = false
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
    public rejectionReason?: string | null, // Added
    public isBlocked = false,
    public isProfileFilled = false,
    public isSubscribed = false
  ) {}
}




//Entity for Profile
export class UserProfile implements UserProfileDetails {
  constructor(
    public id: UniqueEntityID,
    public name: string,
    public email: string,
    public profileImage?: string,
    public phone?: string,
    public location?: string,
    public bio?: string,
    public isBlocked?:boolean,
    public role?: string,
    public bookingCount?:number|undefined,
    public walletBalance?:number|undefined
  ) {}
}

export interface TeamMember {
  id: number;
  name: string;
  qualification: string;
  role: string;
  photo?: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  beforeImage?: string;
  afterImage?: string;
}

export interface ProfileData {
  companyName?: string;
  categories: string[];
  services: string[];
  consultationFee: number;
  establishedYear: number;
  companySize: string;
  overview: string;
  projectsCompleted: number;
  happyCustomers: number;
  awardsWon: number;
  awardsRecognition: string;
  contactOptions: {
    chatSupport: boolean;
    videoCalls: boolean;
  };
  teamMembers: TeamMember[];
  projects: Project[];
  brandIdentity: {
    logo?: string;
    banner1?: string;
    banner2?: string;
    profilePicture?: string;
  };
}

export class CompanyProfile {
  constructor(
    public id: UniqueEntityID,
    public name: string,
    public email: string,
    public phone?: string,
    public location?: string,
    public documentStatus?: string,
    public isBlocked?: boolean,
    public profileImage?: string,
    public documents?: Record<string, string | null>,
    public isProfileFilled?: boolean,
    public isSubscribed?: boolean,
    public profile?: ProfileData
  ) {}
}


//?: symbol is not optional chaing

//phone?: string;
// property phone is optional  UserProfile entity can be string | undefined

//phone:string|undefined;
// property phone (property phone must be there)can be string or undefined in UserProfile entity
