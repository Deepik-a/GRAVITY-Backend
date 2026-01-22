// src/infrastructure/di/types.ts


export const TYPES = {
  // Repositories
  AdminRepository: Symbol.for("AdminRepository"),
  UserRepository: Symbol.for("UserRepository"),
  CompanyRepository: Symbol.for("CompanyRepository"),
  AuthRepository: Symbol.for("AuthRepository"),
  SlotRepository: Symbol.for("SlotRepository"),
  BookingRepository: Symbol.for("BookingRepository"),
  
  // Services
  EmailService: Symbol.for("EmailService"),
  JwtService: Symbol.for("JwtService"),
  OtpService: Symbol.for("OtpService"),
  StorageService: Symbol.for("StorageService"),
  Logger:Symbol.for("Logger"),
  StripeService: Symbol.for("StripeService"),

  // Use Cases - Payment
  CreateCheckoutSessionUseCase: Symbol.for("CreateCheckoutSessionUseCase"),
  CreateSubscriptionCheckoutSessionUseCase: Symbol.for("CreateSubscriptionCheckoutSessionUseCase"),
  StripeWebhookUseCase: Symbol.for("StripeWebhookUseCase"),

  // Use Cases - Admin
  AdminLoginUseCase: Symbol.for("AdminLoginUseCase"),
  GetAllUsersUseCase: Symbol.for("GetAllUsersUseCase"),
  GetAllCompaniesUseCase: Symbol.for("GetAllCompaniesUseCase"),
  VerifyCompanyUseCase: Symbol.for("VerifyCompanyUseCase"),
  ToggleUserBlockStatusUseCase: Symbol.for("ToggleUserBlockStatusUseCase"),
  ToggleCompanyBlockStatusUseCase: Symbol.for("ToggleCompanyBlockStatusUseCase"),
  SearchUserUseCase:Symbol.for("SearchUsersUseCase"),
  SearchCompanyUseCase:Symbol.for("SearchCompanyUseCase"),
  GetAllBookingsUseCase: Symbol.for("GetAllBookingsUseCase"),

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
  UpdateCompanyProfileUseCase: Symbol.for("UpdateCompanyProfileUseCase"),
  DeleteCompanyProfileUseCase: Symbol.for("DeleteCompanyProfileUseCase"),
  GetCompanyProfileUseCase: Symbol.for("GetCompanyProfileUseCase"),
  SetSlotConfigUseCase: Symbol.for("SetSlotConfigUseCase"),
  GetSlotConfigUseCase: Symbol.for("GetSlotConfigUseCase"),
  DeleteSlotConfigUseCase: Symbol.for("DeleteSlotConfigUseCase"),
  GetCompanyBookingsUseCase: Symbol.for("GetCompanyBookingsUseCase"),
  RescheduleBookingUseCase: Symbol.for("RescheduleBookingUseCase"),

// Use Cases - User
  GetUserProfileUseCase: Symbol.for("GetUserProfileUseCase"),
  UpdateUserProfileUseCase: Symbol.for("UpdateUserProfileUseCase"),
  GetAvailableSlotsUseCase: Symbol.for("GetAvailableSlotsUseCase"),
  BookSlotUseCase: Symbol.for("BookSlotUseCase"),
  GetVerifiedCompaniesUseCase: Symbol.for("GetVerifiedCompaniesUseCase"),
  GetUserBookingsUseCase: Symbol.for("GetUserBookingsUseCase"),
  ToggleFavouriteUseCase: Symbol.for("ToggleFavouriteUseCase"),
  GetFavouritesUseCase: Symbol.for("GetFavouritesUseCase"),
  ChangePasswordUseCase: Symbol.for("ChangePasswordUseCase"),
  CompleteBookingUseCase: Symbol.for("CompleteBookingUseCase"),

  // Controllers
  AdminController: Symbol.for("AdminController"),
  AuthController: Symbol.for("AuthController"),
  CompanyDocumentController: Symbol.for("CompanyDocumentController"),
  CompanyProfileController: Symbol.for("CompanyProfileController"),
  ProfileController:Symbol.for("ProfileController"),
  SlotController: Symbol.for("SlotController"),
  CompanyController: Symbol.for("CompanyController"),
  PaymentController: Symbol.for("PaymentController"),

  // Middleware
  SessionAuth: Symbol.for("SessionAuth"),
  
  // Subscription
  SubscriptionRepository: Symbol.for("SubscriptionRepository"),
  CreateSubscriptionPlanUseCase: Symbol.for("CreateSubscriptionPlanUseCase"),
  GetSubscriptionPlansUseCase: Symbol.for("GetSubscriptionPlansUseCase"),
  SubscriptionController: Symbol.for("SubscriptionController"),

  // Reviews
  ReviewRepository: Symbol.for("ReviewRepository"),
  SubmitReviewUseCase: Symbol.for("SubmitReviewUseCase"),
  GetCompanyReviewsUseCase: Symbol.for("GetCompanyReviewsUseCase"),
  ReviewController: Symbol.for("ReviewController"),

  // Finance / Wallet
  TransactionRepository: Symbol.for("TransactionRepository"),
  GetAdminRevenueUseCase: Symbol.for("GetAdminRevenueUseCase"),
  InitiateCompanyPayoutUseCase: Symbol.for("InitiateCompanyPayoutUseCase"),
  GetCompanyWalletUseCase: Symbol.for("GetCompanyWalletUseCase"),
  GetAllTransactionsUseCase: Symbol.for("GetAllTransactionsUseCase"),
  RevenueController: Symbol.for("RevenueController"),
  WalletController: Symbol.for("WalletController"),
  TransactionController: Symbol.for("TransactionController"),

  // Chat
  ChatRepository: Symbol.for("ChatRepository"),
  GetMessagesUseCase: Symbol.for("GetMessagesUseCase"),
  GetConversationsUseCase: Symbol.for("GetConversationsUseCase"),
  SendMessageUseCase: Symbol.for("SendMessageUseCase"),
  ChatController: Symbol.for("ChatController"),
};

