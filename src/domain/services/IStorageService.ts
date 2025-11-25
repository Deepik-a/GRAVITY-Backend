

// domain/services/IStorageService.ts
export interface IStorageService {
  uploadFile(file: Express.Multer.File): Promise<string>;
}
