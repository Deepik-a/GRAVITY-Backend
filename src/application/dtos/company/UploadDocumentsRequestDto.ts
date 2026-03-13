export interface UploadDocumentsRequestDto {
  email: string;
  files: Express.Multer.File[];
}
