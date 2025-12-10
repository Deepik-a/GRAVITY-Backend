import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";
import { AuthenticatedUser } from "../../../domain/entities/User.js";
import { IAdminRepository } from "../../../domain/repositories/IAdminRepository.js";
//Admin@123
@injectable()
export class DetectUserRoleUseCase {
  constructor(
     @inject(TYPES.UserRepository) private _userRepository: IAuthRepository,
     @inject(TYPES.CompanyRepository) private _companyRepository: IAuthRepository,
  ) {}

  async execute(email: string): Promise<{
    repo: IAuthRepository
    role: "user" | "company" ;
    user: any;
    isNewUser: boolean;
  }> {
    if (!email) throw new Error("Email is required");

    console.log("\n========== 🟦 DetectUserRoleUseCase START ==========");
    console.log("📧 Email:", email);

    // 2) Company
    console.log("🔍 Checking company repository...");
    let company = await this._companyRepository.findByEmail(email);

    if (company) {
      console.log("✅ Found COMPANY user");
      console.log("====================================================\n");
      return {
        repo: this._companyRepository,
        role: "company",
        user: company,
        isNewUser: false,
      };
    }

    // 3) User
    console.log("🔍 Checking user repository...");
    let user = await this._userRepository.findByEmail(email);

    if (user) {
      console.log("✅ Found USER");
      console.log("====================================================\n");
      return {
        repo: this._userRepository,
        role: "user",
        user,
        isNewUser: false,
      };
    }

    // 4) New signup
    console.log("🆕 No existing account found — this is a NEW user");
    console.log("====================================================\n");

    return {
      repo: null as any, // default
      role: null as any,
      user: null,
      isNewUser: true,
    };
  }
}
