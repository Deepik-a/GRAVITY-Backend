import { OtpPurpose } from "../enums/OtpPurpose.js";

export interface IOtpService {
  generateOtp(
    email: string,
    purpose: OtpPurpose,
    role?: "user" | "company"
  ): Promise<{ success: boolean; message: string }>;

  verifyOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose
  ): Promise<any>;
}
