// src/infrastructure/di/inversify.config.ts
import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types.js";

// ---------------- Repositories ----------------
import { AdminRepository } from "../repositories/AdminRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CompanyRepository } from "../repositories/CompanyRepository.js";

// ---------------- Services ----------------
import { JwtService } from "../services/JWTService.js";
import { OtpService } from "../services/OTPService.js";
import { S3StorageService } from "../services/S3StorageService.js";

// ---------------- Use Cases (Admin) ----------------
import { AdminLoginUseCase } from "../../application/use-cases/admin/AdminLoginUseCase.js";
import { GetAllUsersUseCase } from "../../application/use-cases/admin/GetAllUsersUseCase.js";
import { GetAllCompaniesUseCase } from "../../application/use-cases/admin/GetAllCompaniesUseCase.js";
import { VerifyCompanyUseCase } from "../../application/use-cases/admin/VerifyCompanyDocument.js";

// ---------------- Use Cases (User/Auth) ----------------
import { DetectUserRoleUseCase } from "../../application/use-cases/user/DetectUserRoleUseCase.js";
import { LoginUserUseCase } from "../../application/use-cases/user/LoginUserUseCase.js";
import { ForgotPasswordUseCase } from "../../application/use-cases/user/ForgotPasswordUseCase.js";
import { VerifyOtpUseCase } from "../../application/use-cases/user/VerifyOtpUseCase.js";
import { ResetPasswordUseCase } from "../../application/use-cases/user/ResetPasswordUseCase .js";
import { RegisterUseCase } from "../../application/use-cases/user/SignupUserUsecase.js";
import { ResendOtpUseCase } from "../../application/use-cases/user/ResendOtpUseCase.js";
import { GoogleAuthUseCase } from "../../application/use-cases/user/GoogleAuthUseCase.js";

// ---------------- Use Cases (Company) ----------------
import { UploadCompanyDocumentsUseCase } from "../../application/use-cases/company/UploadCompanyDocumentsUseCase.js";

// ---------------- Controllers ----------------
import { AdminLoginController } from "../../presentation/controllers/adminController/adminController.js";
import { AuthController } from "../../presentation/controllers/AuthController.js";
import { CompanyDocumentController } from "../../presentation/controllers/companyController/CompanyDocumentController.ts.js";

// ---------------- Middleware ----------------
import { SessionAuth } from "../../presentation/middlewares/authMiddleware.js";
import { EmailService } from "../services/EmailService.js";
import { LoggerService } from "../../domain/services/Logger.js";

const container = new Container();
//the whole file is depency injection
// ---------------- Bind Repositories ----------------
container.bind(TYPES.AdminRepository).to(AdminRepository); //OCP
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.CompanyRepository).to(CompanyRepository);
container.bind(TYPES.AuthRepository).to(UserRepository); // Same repo for login //LSp

// ---------------- Bind Services ----------------
container.bind(TYPES.EmailService).to(EmailService);
container.bind(TYPES.JwtService).to(JwtService);
container.bind(TYPES.OtpService).to(OtpService);
container.bind(TYPES.StorageService).to(S3StorageService).inSingletonScope();
container.bind(TYPES.Logger).to(LoggerService).inSingletonScope();



// ---------------- Bind Admin Use Cases ----------------
container.bind(TYPES.AdminLoginUseCase).to(AdminLoginUseCase);
container.bind(TYPES.GetAllUsersUseCase).to(GetAllUsersUseCase);
container.bind(TYPES.GetAllCompaniesUseCase).to(GetAllCompaniesUseCase);
container.bind(TYPES.VerifyCompanyUseCase).to(VerifyCompanyUseCase);

// ---------------- Bind User/Auth Use Cases ----------------
container.bind(TYPES.DetectUserRoleUseCase).to(DetectUserRoleUseCase);
container.bind(TYPES.LoginUserUseCase).to(LoginUserUseCase);
container.bind(TYPES.ForgotPasswordUseCase).to(ForgotPasswordUseCase);
container.bind(TYPES.VerifyOtpUseCase).to(VerifyOtpUseCase);
container.bind(TYPES.ResetPasswordUseCase).to(ResetPasswordUseCase);
container.bind(TYPES.RegisterUseCase).to(RegisterUseCase);
container.bind(TYPES.ResendOtpUseCase).to(ResendOtpUseCase);
container.bind(TYPES.GoogleAuthUseCase).to(GoogleAuthUseCase);

// ---------------- Bind Company Use Cases ----------------
container.bind(TYPES.UploadCompanyDocumentsUseCase).to(UploadCompanyDocumentsUseCase);

// ---------------- Bind Controllers ----------------
container.bind(TYPES.AdminController).to(AdminLoginController);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.CompanyDocumentController).to(CompanyDocumentController);

// ---------------- Bind Middleware ----------------
container.bind(TYPES.SessionAuth).to(SessionAuth);


export { container };
