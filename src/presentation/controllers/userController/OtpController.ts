import { Request, Response } from "express";
import { GenerateOtpUseCase } from "../../../application/use-cases/user/GenerateOtpUseCase.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";

export class OtpController {
  async sendOtp(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ error: "Email required" });

      const generateOtp = new GenerateOtpUseCase();

      const result = await generateOtp.execute(email);

      res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res
          .status(500)
          .json({ error: "An unexpected error occurred from sendOtp " });
      }
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({ error: "Email and OTP required" });

      const verifyOtp = new VerifyOtpUseCase();
      const result = await verifyOtp.execute(email, otp);

      res.status(200).json(result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        res.status(500).json({ error: error.message });
      } else {
        res
          .status(500)
          .json({ error: "An unexpected error occurred from verifyOtp " });
      }
    }
  }
}
