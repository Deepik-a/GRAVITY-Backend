import { Request, Response, NextFunction } from "express";
import { RegisterUseCase } from "../../application/use-cases/user/SignupUserUsecase.js";
import { LoginUserUseCase } from "../../application/use-cases/user/LoginUserUseCase.js";
import { OtpService } from "../../application/providers/OTPService.js";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository.js";
import { IJwtService } from "../../domain/services/IJWTService.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";

const VALID_ROLES = ["user", "company"] as const;
type RoleType = (typeof VALID_ROLES)[number];

export class AuthController {
  private fixedRole?: RoleType; // optional fixed role for this controller

  constructor(
    private jwtService: IJwtService,
    private otpService: OtpService,
    role?: RoleType // optional fixed role
  ) {
    if (role) {
      this.fixedRole = role;
      console.log("🔹 AuthController initialized with fixed role:", role);
    }
  }

  // Normalize role from frontend (homeowner → user)
  private normalizeRole(role?: string): RoleType {
    console.log("🔹 normalizeRole called with:", role);
    if (!role) return this.fixedRole || "user"; // default if missing
    if (role === "homeowner") {
      console.log("🔹 Role 'homeowner' detected, mapping to 'user'");
      return "user";
    }
    console.log("🔹 Role not mapped, using as-is:", role);
    return role as RoleType;
  }

  // Validate role
  private validateRole(role: unknown): asserts role is RoleType {
    console.log("🔹 validateRole called with:", role);
    if (!VALID_ROLES.includes(role as RoleType)) {
      console.error("❌ Invalid role detected:", role);
      console.error("❌ Valid roles are:", VALID_ROLES);
      throw new Error(`Invalid role: ${role}`);
    }
    console.log("✅ Role validated successfully:", role);
  }

  // Choose repository based on role
  private getRepositoryByRole(role: RoleType): IAuthRepository {
    return role === "company" ? new CompanyRepository() : new UserRepository();
  }

  // Get role for this request (either fixed or from frontend)
  private getRoleForRequest(reqRole?: string): RoleType {
    if (this.fixedRole) return this.fixedRole;
    const normalized = this.normalizeRole(reqRole);
    this.validateRole(normalized);
    return normalized;
  }

  // Register endpoint
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const role = this.getRoleForRequest(req.body.role);
      const repository = this.getRepositoryByRole(role);

      console.log("\n===== 🟩 REGISTER START =====");
      console.log("Role:", role);
      console.log("Payload:", req.body);
      console.log("Repository:", repository.constructor.name);

      const registerUseCase = new RegisterUseCase(repository, this.otpService, role);
      const result = await registerUseCase.execute(req.body);

      console.log("✅ REGISTER SUCCESS:", result);
      console.log("===== 🟩 REGISTER END =====\n");

      res.status(201).json({
        success: true,
        info: `OTP sent successfully for ${role} signup.`,
        ...result,
      });
    } catch (error) {
      console.error("❌ REGISTER ERROR:", error);
      next(error);
    }
  }

  // Login endpoint
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const role = this.getRoleForRequest(req.body.role);
      const repository = this.getRepositoryByRole(role);

      console.log("\n===== 🟦 LOGIN START =====");
      console.log("Role:", role);
      console.log("Payload:", req.body);
      console.log("Repository:", repository.constructor.name);

      const loginUseCase = new LoginUserUseCase(repository, this.jwtService, role);
      const result = await loginUseCase.execute(req.body);

      console.log("✅ LOGIN SUCCESS:", result);
      console.log("===== 🟦 LOGIN END =====\n");

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ LOGIN ERROR:", error);
      next(error);
    }
  }
}
