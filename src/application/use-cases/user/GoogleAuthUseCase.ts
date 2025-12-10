import { IAuthRepository } from "../../../domain/repositories/IAuthRepository.js";
import { GoogleSignUp } from "../../../domain/entities/User.js";
import { GoogleUserMapper } from "../../mappers/GoogleUserMapper.js";
import { IJwtService } from "../../../domain/services/IJWTService.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../infrastructure/DI/types";

@injectable()
export class GoogleAuthUseCase {
  constructor(
    @inject(TYPES.UserRepository) private readonly _userRepository: IAuthRepository,
    @inject(TYPES.CompanyRepository) private readonly _companyRepository: IAuthRepository,
    @inject(TYPES.JwtService) private readonly _jwtService: IJwtService
  ) {}

  async execute({
    googleUser,
    repo,
    existingUser,
    frontendRole,
  }: {
    googleUser: { name: string; email: string; googleId: string };
    repo: IAuthRepository | null;
    existingUser?: any;
    frontendRole?: "user" | "company";
  }) {
    console.log("--- USE CASE EXECUTION START ---");
    console.log(`[INIT] Input Email: ${googleUser.email}, Frontend Role: ${frontendRole}`);

    let user = existingUser;
    console.log(`[VAR] user initialized to: ${user ? 'Existing User Object' : 'null/undefined'}`);
    
    let finalRepo = repo;
    console.log(`[VAR] finalRepo initialized to: ${finalRepo ? 'Provided Repo' : 'null'}`);
    
    let isNewUser = false;
    console.log(`[VAR] isNewUser initialized to: ${isNewUser}`);

    // --- CHECK IF USER EXISTS IN DB ---
    console.log("--- 1. Checking DB for Existing User ---");
    if (!user) {
        console.log("[CONDITION] User is null/undefined. Running DB checks...");
        
        const userByEmail = await this._userRepository.findGoogleUserByEmail(googleUser.email);
        console.log(`[DB] Result from UserRepository: ${userByEmail ? 'Found' : 'Not Found'}`);
        
        const companyByEmail = await this._companyRepository.findGoogleUserByEmail(googleUser.email);
        console.log(`[DB] Result from CompanyRepository: ${companyByEmail ? 'Found' : 'Not Found'}`);

        if (userByEmail) {
            console.log("[ASSIGN] Found user in UserRepository.");
            user = userByEmail;
            finalRepo = this._userRepository;
        } else if (companyByEmail) {
            console.log("[ASSIGN] Found user in CompanyRepository.");
            user = companyByEmail;
            finalRepo = this._companyRepository;
        }
        console.log(`[CHECK] User object after DB lookups: ${user ? `ID: ${user.id?.toString()}` : 'STILL NULL'}`);
    } else {
        console.log("[SKIP] User object was already provided (existingUser input).");
    }

    // --- CREATE NEW USER IF NOT FOUND ---
    console.log("--- 2. Checking for New User Creation ---");
    if (!user) {
        console.log("[CONDITION] User is null. Proceeding to create new user.");
        
        if (!frontendRole) {
            console.error("[ERROR] Frontend Role is required for first-time signup.");
            throw new Error("Role is required for first-time signup");
        }

        finalRepo = frontendRole === "company" ? this._companyRepository : this._userRepository;
        console.log(`[ASSIGN] finalRepo set for new ${frontendRole}`);

        const status = frontendRole === "company" ? "pending" : "verified";
        console.log(`[VAR] New user status set to: ${status}`);

        const newUser = new GoogleSignUp(
            googleUser.name,
            googleUser.email,
            googleUser.googleId,
            frontendRole,
            "google",
            status
        );
        console.log(`[OBJ] GoogleSignUp object created for new user.`);

        user = await finalRepo.createWithGoogle(newUser);
        console.log(`[DB] New user created. ID: ${user.id?.toString()}`);
        
        isNewUser = true;
        console.log("[ASSIGN] isNewUser set to true.");
    }

    // --- COMPANY VERIFICATION CHECK ---
    console.log("--- 3. Company Verification Check ---");
    const isCompany = user.role === "company";
    const isPending = user.status === "pending";
    const isExisting = !isNewUser;
    
    console.log(`[LOGIC] Role: ${user.role}, Status: ${user.status}, New User: ${isNewUser}`);
    
    if (isCompany && isPending && isExisting) {
        console.log("[CONDITION] User is existing company with PENDING status.");
        
        const docStatus = user.documentStatus;
        console.log(`[DATA CHECK] user.documentStatus found as: ${docStatus}`);
        
        if (docStatus === 'pending') {
            console.error("[ERROR] Blocking login: documentStatus is 'pending'.");
            throw new Error("Company verification is pending approval by admin. Please wait.");
        }
    }

    // --- GENERATE JWT ---
    console.log("--- 4. Generating Tokens ---");
    const subject = user.id?.toString() || user.googleId;
    console.log(`[VAR] Subject for JWT (ID/GoogleID): ${subject}`);

    const accessTokenPayload = {
        userId: subject,
        role: user.role,
        status: user.status,
    };
    console.log("[JWT] Access Token Payload:", accessTokenPayload);
    const accessToken = this._jwtService.signAccessToken(accessTokenPayload);
    console.log(`[JWT] Access Token generated (starts with: ${accessToken.substring(0, 15)}...)`);

    const refreshTokenPayload = {
        userId: subject,
        role: user.role,
        status: user.status,
    };
    console.log("[JWT] Refresh Token Payload:", refreshTokenPayload);
    const refreshToken = this._jwtService.signRefreshToken(refreshTokenPayload);
    console.log(`[JWT] Refresh Token generated (starts with: ${refreshToken.substring(0, 15)}...)`);


    // --- RETURN RESPONSE ---
    console.log("--- 5. Preparing Response DTO ---");
    
    // Log the user object immediately before DTO mapping
    console.log("🔑 [FINAL USER OBJECT] Data passed to mapper:", {
        id: user.id?.toString(),
        role: user.role,
        status: user.status,
        documentStatus: user.documentStatus,
        rejectionReason: user.rejectionReason,
    });
    
    const userResponseDTO = GoogleUserMapper.toResponseDTO(user, accessToken);
    console.log("[DTO] User DTO created.");
    
    const finalReturn = {
        user: userResponseDTO,
        accessToken,
        refreshToken,
        isNewUser,
        documentStatus: user.documentStatus, 
        rejectionReason: user.rejectionReason,
    };
    
    console.log("✅ [RETURN] Final object being returned:", finalReturn);
    console.log("--- USE CASE EXECUTION END ---");

    return finalReturn;
  }
}