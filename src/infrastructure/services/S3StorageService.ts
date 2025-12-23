import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "../../domain/services/IStorageService";
import { injectable } from "inversify";
import { env } from "../config/env.js";

@injectable()
export class S3StorageService implements IStorageService {

  private readonly _s3 = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY,
      secretAccessKey: env.AWS_SECRET_KEY,
    },
  });

  // ------------------ UPLOAD ------------------
  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = env.S3_BUCKET;
    const key = `company-documents/${Date.now()}_${file.originalname}`;

    await this._s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
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

