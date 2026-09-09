import { v2 as cloudinary } from "cloudinary";
import { IStorageService } from "@/domain/services/IStorageService";
import { env } from "@/infrastructure/config/env";
import { ILogger } from "@/domain/services/ILogger";
import { TYPES } from "@/infrastructure/DI/types";
import { inject, injectable } from "inversify";
import sharp from "sharp";

@injectable()
export class CloudinaryStorageService implements IStorageService {
  constructor(
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {
    // Validate Cloudinary environment variables
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      this._logger.error('🚨 Missing Cloudinary environment variables', {
        missing: [
          !env.CLOUDINARY_CLOUD_NAME && 'CLOUDINARY_CLOUD_NAME',
          !env.CLOUDINARY_API_KEY && 'CLOUDINARY_API_KEY',
          !env.CLOUDINARY_API_SECRET && 'CLOUDINARY_API_SECRET',
        ].filter(Boolean),
      });
      throw new Error('Missing Cloudinary environment variables');
    }

    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: env.CLOUDINARY_API_KEY.trim(),
      api_secret: env.CLOUDINARY_API_SECRET.trim(),
      secure: true,
    });

    // Log credentials (masked)
    console.log("🔎 [Cloudinary Init] Cloud Name:", env.CLOUDINARY_CLOUD_NAME.trim(), "API Key:", env.CLOUDINARY_API_KEY.trim().slice(0, 4) + "***");
    this._logger.info("Cloudinary credentials initialized", {
      cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: env.CLOUDINARY_API_KEY.trim().slice(0, 4) + "***",
    });
  }

  // ------------------ UPLOAD FILE TO CLOUDINARY ------------------
  async uploadFile(file: Express.Multer.File, folder = "company-documents"): Promise<string> {
    let fileBuffer = file.buffer;
    let fileName = file.originalname;

    // Compress if it's an image
    if (file.mimetype.startsWith("image/")) {
      try {
        fileBuffer = await sharp(file.buffer)
          .resize({ width: 1200, withoutEnlargement: true }) // Resize to max 1200px width
          .webp({ quality: 80 }) // Convert to webp with 80% quality
          .toBuffer();

        const nameWithoutExt = fileName.includes(".")
          ? fileName.split(".").slice(0, -1).join(".")
          : fileName;
        fileName = `${nameWithoutExt}.webp`;
      } catch (error) {
        this._logger.error("Sharp compression failed, uploading original image:", { error });
      }
    }

    // Clean folder name (remove leading/trailing slashes)
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const publicId = `${Date.now()}_${fileName.replace(/\.[^/.]+$/, "")}`;

    return new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: cleanFolder,
          public_id: publicId,
          resource_type: "auto", // Automatically detects image, raw file, pdf, etc.
        },
        (error, result) => {
          if (error) {
            this._logger.error("❌ Cloudinary upload failed:", { error });
            return reject(error);
          }
          if (!result?.secure_url) {
            this._logger.error("❌ Cloudinary upload returned no secure_url");
            return reject(new Error("Cloudinary upload failed to return secure_url"));
          }
          this._logger.info(`✅ File uploaded successfully to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  // ------------------ GET URL ------------------
  async getSignedUrl(key: string): Promise<string> {
    if (!key) return "";

    // If key is already a full URL (Cloudinary or external), return directly
    if (key.startsWith("http") || key.startsWith("data:")) {
      return key;
    }

    // If it's a Cloudinary public_id without protocol, construct secure URL
    try {
      return cloudinary.url(key, { secure: true });
    } catch (err) {
      this._logger.error("Failed to construct Cloudinary URL:", { error: err, key });
      return key;
    }
  }
}
