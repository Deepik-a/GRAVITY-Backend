import { Router } from "express";
import multer from "multer";
import { container } from "@/infrastructure/DI/inversify.config";
import { TYPES } from "@/infrastructure/DI/types";
import { CompanyDocumentController } from "@/presentation/controllers/companyController/CompanyDocumentController";
const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const controller = container.get<CompanyDocumentController>(TYPES.CompanyDocumentController);

router.post(
  "/upload-documents",
  upload.array("documents", 3),
  controller.upload.bind(controller)
);

export default router;
