import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageService } from "../../domain/services/IStorageService";

export class S3StorageService implements IStorageService {
  private readonly _s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_SECRET_KEY!,
    },
  });

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = process.env.S3_BUCKET!;
    const key = `company-documents/${Date.now()}_${file.originalname}`;

    await this._s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    // Return signed URL
    return this.getSignedUrl(key);
  }

  // ✅ New method to generate signed URL for existing object
  async getSignedUrl(key: string): Promise<string> {
    const bucket = process.env.S3_BUCKET!;
    return getSignedUrl(
      this._s3,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 3600 } // 1 hour
    );
  }
}
