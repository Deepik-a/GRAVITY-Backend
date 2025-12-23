// src/infrastructure/di/inversify.config.ts
import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

// ---------------- Repositories ----------------
import { AdminRepository } from "@/infrastructure/repositories/AdminRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { CompanyRepository } from "@/infrastructure/repositories/CompanyRepository";

// ---------------- Services ----------------
import { JwtService } from "@/infrastructure/services/JWTService";
import { OtpService } from "@/infrastructure/services/OTPService";
import { S3StorageService } from "@/infrastructure/services/S3StorageService";

// ---------------- Use Cases (Admin) ----------------
import { AdminLoginUseCase } from "@/application/use-cases/admin/AdminLoginUseCase";
import { GetAllUsersUseCase } from "@/application/use-cases/admin/GetAllUsersUseCase";
import { GetAllCompaniesUseCase } from "@/application/use-cases/admin/GetAllCompaniesUseCase";
import { VerifyCompanyUseCase } from "@/application/use-cases/admin/VerifyCompanyUseCase";
import { ToggleUserBlockStatusUseCase } from "@/application/use-cases/admin/ToggleUserBlockStatusUseCase";
import { ToggleCompanyBlockStatusUseCase } from "@/application/use-cases/admin/ToggleCompanyBlockStatusUseCase";

// ---------------- Use Cases (User/Auth) ----------------
import { DetectUserRoleUseCase } from "@/application/use-cases/user/DetectUserRoleUseCase";
import { LoginUserUseCase } from "@/application/use-cases/user/LoginUserUseCase";
import { ForgotPasswordUseCase } from "@/application/use-cases/user/ForgotPasswordUseCase";
import { VerifyOtpUseCase } from "@/application/use-cases/user/VerifyOtpUseCase";
import { ResetPasswordUseCase } from "@/application/use-cases/user/ResetPasswordUseCase";
import { RegisterUseCase } from "@/application/use-cases/user/RegisterUseCase";
import { ResendOtpUseCase } from "@/application/use-cases/user/ResendOtpUseCase";
import { GoogleAuthUseCase } from "@/application/use-cases/user/GoogleAuthUseCase";
import { GetUserProfileUseCase } from "@/application/use-cases/user/GetUserProfileUseCase";






// ---------------- Use Cases (Company) ----------------
import { UploadCompanyDocumentsUseCase } from "@/application/use-cases/company/UploadCompanyDocumentsUseCase";

// ---------------- Controllers ----------------
import { AdminLoginController } from "@/presentation/controllers/adminController/AdminController";
import { AuthController } from "@/presentation/controllers/AuthController";
import { CompanyDocumentController } from "@/presentation/controllers/companyController/CompanyDocumentController";
import { ProfileController } from "@/presentation/controllers/userController/ProfileController";

// ---------------- Middleware ----------------
import { SessionAuth } from "@/presentation/middlewares/authMiddleware";
import { EmailService } from "@/infrastructure/services/EmailService";
import { LoggerService } from "@/domain/services/Logger";

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
container.bind(TYPES.ToggleUserBlockStatusUseCase).to(ToggleUserBlockStatusUseCase);
container.bind(TYPES.ToggleCompanyBlockStatusUseCase).to(ToggleCompanyBlockStatusUseCase);

// ---------------- Bind User/Auth Use Cases ----------------
container.bind(TYPES.DetectUserRoleUseCase).to(DetectUserRoleUseCase);
container.bind(TYPES.LoginUserUseCase).to(LoginUserUseCase);
container.bind(TYPES.ForgotPasswordUseCase).to(ForgotPasswordUseCase);
container.bind(TYPES.VerifyOtpUseCase).to(VerifyOtpUseCase);
container.bind(TYPES.ResetPasswordUseCase).to(ResetPasswordUseCase);
container.bind(TYPES.RegisterUseCase).to(RegisterUseCase);
container.bind(TYPES.ResendOtpUseCase).to(ResendOtpUseCase);
container.bind(TYPES.GoogleAuthUseCase).to(GoogleAuthUseCase);
container.bind(TYPES.GetUserProfileUseCase).to(GetUserProfileUseCase);


// ---------------- Bind Company Use Cases ----------------
container.bind(TYPES.UploadCompanyDocumentsUseCase).to(UploadCompanyDocumentsUseCase);

// ---------------- Bind Controllers ----------------
container.bind(TYPES.AdminController).to(AdminLoginController);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.CompanyDocumentController).to(CompanyDocumentController);
container.bind(TYPES.ProfileController).to(ProfileController);

// ---------------- Bind Middleware ----------------
container.bind(TYPES.SessionAuth).to(SessionAuth);


export { container };
