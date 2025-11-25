import { Router } from "express";

// Repository
import { AdminRepository } from "../../infrastructure/repositories/AdminRepository.js";

// Services
import { JwtService } from "../../infrastructure/services/JWTService.js";
import { IJwtService } from "../../domain/services/IJWTService.js";

// Use Cases
import { AdminLoginUseCase } from "../../application/use-cases/admin/AdminLoginUseCase.js";
import { GetAllUsersUseCase } from "../../application/use-cases/admin/GetAllUsersUseCase.js";

// Controller
import { AdminLoginController } from "../controllers/adminController/adminController.js";

// Domain Interface
import { IAdminRepository } from "../../domain/repositories/IAdminRepository.js";
import { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { UserRepository } from "../../infrastructure/repositories/UserRepository.js";
import { IStorageService } from "../../domain/services/IStorageService.js";
import { S3StorageService } from "../../infrastructure/services/S3StorageService.js";
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";
import { GetAllCompaniesUseCase } from "../../application/use-cases/admin/GetAllCompaniesUseCase.js";
import { VerifyCompanyUseCase } from "../../application/use-cases/admin/VerifyCompanyDocument.js";

const router = Router();

// ----------------------------------------------------
// Instantiate Dependencies
// ----------------------------------------------------
const adminRepo: IAdminRepository = new AdminRepository();
const userRepo:IUserRepository=new UserRepository()
const jwtService: IJwtService = new JwtService();
const s3Service:IStorageService = new S3StorageService(); // Inject S3
const companyRepo:ICompanyRepository = new CompanyRepository();

// ----------------------------------------------------
// Use Cases (Dependency Injection)
// ----------------------------------------------------
const adminLoginUseCase = new AdminLoginUseCase(adminRepo, jwtService);
const getAllUsersUseCase=new GetAllUsersUseCase(userRepo)
const getAllCompaniesUseCase = new GetAllCompaniesUseCase(companyRepo);
const verifyCompanyUseCase=new VerifyCompanyUseCase(companyRepo)
// ----------------------------------------------------
// Controller Injection
// ----------------------------------------------------
const adminLoginController = new AdminLoginController(adminLoginUseCase,getAllUsersUseCase,getAllCompaniesUseCase,verifyCompanyUseCase);

// ----------------------------------------------------
// Routes
// ----------------------------------------------------
router.post("/login", adminLoginController.login.bind(adminLoginController));
router.get('/usermanagment',adminLoginController.getUsers.bind(adminLoginController))
router.get("/companies", adminLoginController.getCompanies.bind(adminLoginController));
router.post("/verify-company", adminLoginController.verifyCompany.bind(adminLoginController));

export default router;
