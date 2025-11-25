import { Router } from "express";
import multer from "multer";

// Repositories
import { CompanyRepository } from "../../infrastructure/repositories/CompanyRepository.js";

// Services
import { S3StorageService } from "../../infrastructure/services/S3StorageService.js";

// Use Cases
import { UploadCompanyDocumentsUseCase } from "../../application/use-cases/company/UploadCompanyDocumentsUseCase.js";

// Controller
import { CompanyDocumentController } from "../controllers/companyController/CompanyDocumentController.ts.js";

// Domain Interfaces
import { ICompanyRepository } from "../../domain/repositories/ICompanyRepository.js";
import { IStorageService } from "../../domain/services/IStorageService.js";

// ----------------------------------------------------
// Multer setup for file upload
// ----------------------------------------------------
const upload = multer({ storage: multer.memoryStorage() });

// ----------------------------------------------------
// Instantiate Dependencies
// ----------------------------------------------------
const companyRepo: ICompanyRepository = new CompanyRepository();
const storageService: IStorageService = new S3StorageService();

// ----------------------------------------------------
// Use Case Injection
// ----------------------------------------------------
const uploadDocsUseCase = new UploadCompanyDocumentsUseCase(
  storageService,
  companyRepo
);

// ----------------------------------------------------
// Controller Injection
// ----------------------------------------------------
const companyDocumentController = new CompanyDocumentController(
  uploadDocsUseCase
);

// ----------------------------------------------------
// Routes
// ----------------------------------------------------
const router = Router();

// No authentication required for pre-login document upload
router.post(
  "/upload-documents",
  upload.array("documents", 3),    // Expect exactly 3 files
  companyDocumentController.upload.bind(companyDocumentController)
);

export default router;
