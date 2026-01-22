import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "@/domain/services/IStorageService";
import { env } from "@/infrastructure/config/env";
import { ILogger } from "@/domain/services/ILogger";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";

import sharp from "sharp";

@injectable()
export class S3StorageService implements IStorageService {

  private readonly _s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
    },
  });

  constructor(
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {}

  // ------------------ UPLOAD ------------------
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = env.S3_BUCKET;
    
    let fileBuffer = file.buffer;
    let contentType = file.mimetype;
    let fileName = file.originalname;

    // Compress if it's an image
    if (file.mimetype.startsWith("image/")) {
      try {
        fileBuffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true }) // Resize to max 1200px width
          .webp({ quality: 80 }) // Convert to webp with 80% quality
          .toBuffer();
        
        contentType = "image/webp";
        // Update file extension in fileName
        const nameWithoutExt = fileName.includes(".") 
          ? fileName.split(".").slice(0, -1).join(".") 
          : fileName;
        fileName = `${nameWithoutExt}.webp`;
      } catch (error) {
        this._logger.error("Sharp compression failed, uploading original:", { error });
      }
    }

    const key = `company-documents/${Date.now()}_${fileName}`;

    await this._s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // ⛔ DO NOT return signed URL here
    // ✔ ONLY return file key
    return key;
  }

  // ------------------ SIGNED URL ON DEMAND ------------------
  async getSignedUrl(key: string): Promise<string> {
    const bucket = env.S3_BUCKET;
    
    return await getSignedUrl(
      this._s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: env.S3_URL_EXPIRATION } // 5 min validity for security
    );
  }
}

