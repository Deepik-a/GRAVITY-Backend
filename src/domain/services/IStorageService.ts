

// domain/services/IStorageService.ts
export interface IStorageService {
  uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
}
