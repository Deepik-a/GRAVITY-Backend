import { OtpPurpose } from "@/domain/enums/OtpPurpose";
import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { UserSignUp, GoogleSignUp } from "@/domain/entities/User";

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface VerifyOtpRequestDto {
  email: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface ForgotPasswordRequestDto {
  email: string;
}

export interface ResetPasswordRequestDto {
  email: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface ResendOtpRequestDto {
  email: string;
}

export interface LoginResponseDto {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    isProfileFilled?: boolean;
    isSubscribed?: boolean;
  };
  role: string;
  accessToken: string;
  refreshToken: string;
  documentStatus?: string;
  rejectionReason?: string | null;
}

export interface DetectRoleResponseDto {
  repo: IAuthRepository | null; 
  role: "user" | "company" | "admin" | null;
  user: UserSignUp | GoogleSignUp | null;
  isNewUser: boolean;
}

export interface GoogleAuthRequestDto {
  googleUser: { 
    name: string; 
    email: string; 
    googleId: string 
  };
  repo?: IAuthRepository; // Made optional since you check if it exists
  existingUser?: UserSignUp | GoogleSignUp | null;
  frontendRole?: "user" | "company";
}

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name: string;
}

export interface GoogleUserResponseDto {
  id: string; // Added id
  name: string;
  email: string;
  googleId: string;
  token: string;
  role: "user" | "company";
  documentStatus?: "pending" | "verified" | "rejected" | "not_submitted";
  isProfileFilled?: boolean;
  isSubscribed?: boolean;
}

export interface GoogleAuthResponseDto {
  user: GoogleUserResponseDto; 
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  documentStatus?: "pending" | "verified" | "rejected" | "not_submitted";
  rejectionReason?: string | null;
}

export interface ForgotPasswordResponseDto {
  success: boolean;
  message: string;
}

export interface ResendOtpResponseDto {
  message: string;
}

export interface ResetPasswordResponseDto {
  success: boolean;
  message: string;
}

export interface VerifyOtpResponseDto {
  success: boolean;
  message: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserSignUp | GoogleUserResponseDto | null;
}

export interface SignupRequestDto {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  phone: string;
  role: "user" | "company";
}

export interface SignupResponseDto {
  message: string;
  email?: string;
}
