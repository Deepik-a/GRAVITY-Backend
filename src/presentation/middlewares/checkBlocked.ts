// // src/middleware/checkBlocked.ts
// import { NextFunction, Request, Response } from "express";
// import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

// export class CheckBlockedMiddleware {
//   constructor(
//     private userRepository: IAuthRepository,
//     private companyRepository: IAuthRepository
//   ) {}

//   handle = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const userId = req.user?.id;
//       const role = req.user?.role;

//       if (!userId || !role) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       let isBlocked = false;

//       if (role === "user") {
//         const user = await this.userRepository.findById(userId);
//         if (!user) return res.status(404).json({ message: "User not found" });
//         isBlocked = user.isBlocked;
//       } else if (role === "company") {
//         const company = await this.companyRepository.findById(userId);
//         if (!company) return res.status(404).json({ message: "Company not found" });
//         isBlocked = company.isBlocked;
//       }

//       if (isBlocked) {
//         return res.status(403).json({ 
//           message: "Your account has been blocked. Please contact support." 
//         });
//       }

//       next();
//     } catch (err) {
//       next(err);
//     }
//   };
// }