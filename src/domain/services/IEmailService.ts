export interface IEmailService {
  sendOtpEmail(to: string, otp: string): Promise<void>;
  sendRejectionEmail(to: string, reason: string): Promise<void>;
}
