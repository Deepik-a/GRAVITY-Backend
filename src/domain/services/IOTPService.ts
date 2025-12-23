import { OtpPurpose } from "@/domain/enums/OtpPurpose";

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  // Payload is optional because some flows (like Signup) 
  // might just need a boolean, while others (Login) need data.
  data?: {
    email: string;
    role?: "user" | "company";
    tempToken?: string;
  };
}

export interface IOtpService {
  generateOtp(
    email: string,
    purpose: OtpPurpose,
    role?: "user" | "company"
  ): Promise<{ success: boolean; message: string }>;

  // Replaced 'any' with the new interface
  verifyOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose
  ): Promise<OtpVerificationResult>;
}