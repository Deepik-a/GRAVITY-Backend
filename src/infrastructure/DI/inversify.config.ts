// src/infrastructure/di/inversify.config.ts
import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

// ---------------- Repositories ----------------
import { AdminRepository } from "@/infrastructure/repositories/AdminRepository";
import { UserRepository } from "@/infrastructure/repositories/UserRepository";
import { CompanyRepository } from "@/infrastructure/repositories/CompanyRepository";
import { SlotRepository } from "@/infrastructure/repositories/SlotRepository";
import { BookingRepository } from "@/infrastructure/repositories/BookingRepository";

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
import { SearchUserUseCase } from "@/application/use-cases/admin/SearchUsersUseCase";
import { SearchCompanyUseCase } from "@/application/use-cases/admin/SearchCompanyUseCase";

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
import { UpdateUserProfileUseCase } from "@/application/use-cases/user/UpdateUserProfileUseCase";
import { GetAvailableSlotsUseCase } from "@/application/use-cases/user/GetAvailableSlotsUseCase";
import { BookSlotUseCase } from "@/application/use-cases/user/BookSlotUseCase";
import { GetVerifiedCompaniesUseCase } from "@/application/use-cases/user/GetVerifiedCompaniesUseCase";
import { GetUserBookingsUseCase } from "@/application/use-cases/user/GetUserBookingsUseCase";






// ---------------- Use Cases (Company) ----------------
import { UploadCompanyDocumentsUseCase } from "@/application/use-cases/company/UploadCompanyDocumentsUseCase";
import { UpdateCompanyProfileUseCase } from "@/application/use-cases/company/UpdateCompanyProfileUseCase";
import { DeleteCompanyProfileUseCase } from "@/application/use-cases/company/DeleteCompanyProfileUseCase";
import { GetCompanyProfileUseCase } from "@/application/use-cases/company/GetCompanyProfileUseCase";
import { SetSlotConfigUseCase } from "@/application/use-cases/company/SetSlotConfigUseCase";
import { GetSlotConfigUseCase } from "@/application/use-cases/company/GetSlotConfigUseCase";
import { DeleteSlotConfigUseCase } from "@/application/use-cases/company/DeleteSlotConfigUseCase";
import { GetCompanyBookingsUseCase } from "@/application/use-cases/company/GetCompanyBookingsUseCase";

// ---------------- Controllers ----------------
import { AdminLoginController } from "@/presentation/controllers/adminController/AdminController";
import { AuthController } from "@/presentation/controllers/AuthController";
import { CompanyDocumentController } from "@/presentation/controllers/companyController/CompanyDocumentController";
import { CompanyProfileController } from "@/presentation/controllers/companyController/CompanyProfileController";
import { ProfileController } from "@/presentation/controllers/userController/ProfileController";
import { SlotController } from "@/presentation/controllers/SlotController";
import { CompanyController } from "@/presentation/controllers/userController/CompanyController";

// ---------------- Middleware ----------------
import { SessionAuth } from "@/presentation/middlewares/AuthMiddleware";
import { EmailService } from "@/infrastructure/services/EmailService";
import { LoggerService } from "@/domain/services/Logger";

const container = new Container();
//the whole file is depency injection
// ---------------- Bind Repositories ----------------
container.bind(TYPES.AdminRepository).to(AdminRepository); //OCP
container.bind(TYPES.UserRepository).to(UserRepository);
container.bind(TYPES.CompanyRepository).to(CompanyRepository);
container.bind(TYPES.SlotRepository).to(SlotRepository);
container.bind(TYPES.BookingRepository).to(BookingRepository);
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
container.bind(TYPES.SearchUserUseCase).to(SearchUserUseCase);
container.bind(TYPES.SearchCompanyUseCase).to(SearchCompanyUseCase);

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
container.bind(TYPES.UpdateUserProfileUseCase).to(UpdateUserProfileUseCase);
container.bind(TYPES.GetAvailableSlotsUseCase).to(GetAvailableSlotsUseCase);
container.bind(TYPES.BookSlotUseCase).to(BookSlotUseCase);
container.bind(TYPES.GetVerifiedCompaniesUseCase).to(GetVerifiedCompaniesUseCase);
container.bind(TYPES.GetUserBookingsUseCase).to(GetUserBookingsUseCase);


// ---------------- Bind Company Use Cases ----------------
container.bind(TYPES.UploadCompanyDocumentsUseCase).to(UploadCompanyDocumentsUseCase);
container.bind(TYPES.UpdateCompanyProfileUseCase).to(UpdateCompanyProfileUseCase);
container.bind(TYPES.DeleteCompanyProfileUseCase).to(DeleteCompanyProfileUseCase);
container.bind(TYPES.GetCompanyProfileUseCase).to(GetCompanyProfileUseCase);
container.bind(TYPES.SetSlotConfigUseCase).to(SetSlotConfigUseCase);
container.bind(TYPES.GetSlotConfigUseCase).to(GetSlotConfigUseCase);
container.bind(TYPES.DeleteSlotConfigUseCase).to(DeleteSlotConfigUseCase);
container.bind(TYPES.GetCompanyBookingsUseCase).to(GetCompanyBookingsUseCase);

// ---------------- Bind Controllers ----------------
container.bind(TYPES.AdminController).to(AdminLoginController);
container.bind(TYPES.AuthController).to(AuthController);
container.bind(TYPES.CompanyDocumentController).to(CompanyDocumentController);
container.bind(TYPES.CompanyProfileController).to(CompanyProfileController);
container.bind(TYPES.ProfileController).to(ProfileController);
container.bind(TYPES.SlotController).to(SlotController);
container.bind(TYPES.CompanyController).to(CompanyController);

// ---------------- Bind Middleware ----------------
container.bind(TYPES.SessionAuth).to(SessionAuth);


export { container };
