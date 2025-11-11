// import { Request, Response, NextFunction } from "express";
// import { GoogleAuthUseCase } from "../../../application/use-cases/user/GoogleAuthUseCase.js";
// import { UserRepository } from "../../../infrastructure/repositories/UserRepository.js";
// import { verifyGoogleToken } from "../../../infrastructure/stratergies/googleStratergy.js";

// export class GoogleAuthController {
//   async googleLogin(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { token } = req.body;
//       if (!token) throw new Error("Missing Google token");

//       // 1️⃣ Verify Google token and extract user info
//       const googleUser = await verifyGoogleToken(token);

//       // 2️⃣ Run use case
//       const useCase = new GoogleAuthUseCase(new UserRepository());
//       const { user, accessToken, refreshToken } = await useCase.execute(googleUser);

//       // 3️⃣ Set cookies
//       res.cookie("accessToken", accessToken, {
//         httpOnly: true,
//         sameSite: "lax", // use "none" if frontend is on another domain
//         secure: false, // set true in production
//         maxAge: 15 * 60 * 1000,
//       });

//       res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         sameSite: "lax",
//         secure: false,
//         maxAge: 7 * 24 * 60 * 60 * 1000,
//       });

//       // 4️⃣ Send response
//       return res.status(200).json({
//         message: "Google login successful",
//         user,
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
// }
