// src/infrastructure/di/types.ts


export const TYPES = {
  // Repositories
  AdminRepository: Symbol.for("AdminRepository"),
  UserRepository: Symbol.for("UserRepository"),
  CompanyRepository: Symbol.for("CompanyRepository"),
  AuthRepository: Symbol.for("AuthRepository"),
  
  // Services
  EmailService: Symbol.for("EmailService"),
  JwtService: Symbol.for("JwtService"),
  OtpService: Symbol.for("OtpService"),
  StorageService: Symbol.for("StorageService"),
  Logger:Symbol.for("Logger"),

  // Use Cases - Admin
  AdminLoginUseCase: Symbol.for("AdminLoginUseCase"),
  GetAllUsersUseCase: Symbol.for("GetAllUsersUseCase"),
  GetAllCompaniesUseCase: Symbol.for("GetAllCompaniesUseCase"),
  VerifyCompanyUseCase: Symbol.for("VerifyCompanyUseCase"),
  ToggleUserBlockStatusUseCase: Symbol.for("ToggleUserBlockStatusUseCase"),
  ToggleCompanyBlockStatusUseCase: Symbol.for("ToggleCompanyBlockStatusUseCase"),
  SearchUserUseCase:Symbol.for("SearchUsersUseCase"),
  SearchCompanyUseCase:Symbol.for("SearchCompanyUseCase"),

  // Use Cases - User/Auth
  DetectUserRoleUseCase: Symbol.for("DetectUserRoleUseCase"),
  LoginUserUseCase: Symbol.for("LoginUserUseCase"),
  ForgotPasswordUseCase: Symbol.for("ForgotPasswordUseCase"),
  VerifyOtpUseCase: Symbol.for("VerifyOtpUseCase"),
  ResetPasswordUseCase: Symbol.for("ResetPasswordUseCase"),
  RegisterUseCase: Symbol.for("RegisterUseCase"),
  ResendOtpUseCase: Symbol.for("ResendOtpUseCase"),
  GoogleAuthUseCase: Symbol.for("GoogleAuthUseCase"),


  // Use Cases - Company
  UploadCompanyDocumentsUseCase: Symbol.for("UploadCompanyDocumentsUseCase"),

// Use Cases - User
  GetUserProfileUseCase: Symbol.for("GetUserProfileUseCase"),

  // Controllers
  AdminController: Symbol.for("AdminController"),
  AuthController: Symbol.for("AuthController"),
  CompanyDocumentController: Symbol.for("CompanyDocumentController"),
  ProfileController:Symbol.for("ProfileController"),

  // Middleware
  SessionAuth: Symbol.for("SessionAuth"),
};
