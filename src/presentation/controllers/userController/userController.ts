import type { Request, Response } from "express";
import { RegisterUserUseCase } from "../../../application/use-cases/user/SignupUserUsecase.js";
import { LoginUserUseCase } from "../../../application/use-cases/user/LoginUserUseCase.js";
import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
import { VerifyOtpUseCase } from "../../../application/use-cases/user/VerifyOtpUseCase.js";
import { HandleError } from "../../../shared/utils/handleError.js";
const userRepository = new UserRepository();

export class UserController {
  async register(req: Request, res: Response) {
    try {
      console.log("hi from controller");
      const registerUserUseCase = new RegisterUserUseCase(userRepository);

      const result = await registerUserUseCase.execute(req.body);
      console.log(req.body, "req.body has been received to controller");
      res.status(200).json(result);
    } catch (error: unknown) {
      HandleError(res, error, 400);
    }
  }

  async login(req: Request, res: Response) {
    console.log("hi from login");
    try {
      const loginUserUseCase = new LoginUserUseCase(userRepository);
      const { user, token } = await loginUserUseCase.execute(req.body);

      res.status(200).json({
        message: "Login succesful",
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        token,
      });
    } catch (error: unknown) {
      HandleError(res, error, 400);
    }
  }

  async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const userRepository = new UserRepository();
      const verifyOtp = new VerifyOtpUseCase(userRepository);
      const result = await verifyOtp.execute(email, otp);
      res.status(200).json(result);
    } catch (error: unknown) {
      HandleError(res, error, 400);
    }
  }
}
