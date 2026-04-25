import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import ReviewModel, { IReviewDocument } from "@/infrastructure/database/models/ReviewModel";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";
import { injectable } from "inversify";
import mongoose from "mongoose";
import { IStorageService } from "@/domain/services/IStorageService";
import { ILogger } from "@/domain/services/ILogger";
import { TYPES } from "@/infrastructure/DI/types";
import { inject } from "inversify";

@injectable()
export class ReviewRepository extends BaseRepository<IReviewDocument> implements IReviewRepository {
  constructor(
    @inject(TYPES.StorageService) private readonly _s3Service: IStorageService,
    @inject(TYPES.Logger) private readonly _logger: ILogger
  ) {
    super(ReviewModel);
  }

  private async _resolveUserImageUrl(url?: string): Promise<string | undefined> {
    if (!url || url.startsWith("http") || url.startsWith("data:")) return url;
    try {
      return await this._s3Service.getSignedUrl(url);
    } catch (err) {
      this._logger.error(`// Failed to resolve review user profile image: ${url}`, { error: err });
      return url;
    }
  }

  async createReview(review: IReview): Promise<IReview> {
    const created = await this.model.create(review);
    return await this._mapToEntity(created.toObject());
  }

  async findByCompanyId(companyId: string): Promise<IReview[]> {
    const reviews = await this.model.find({ companyId })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();
    return Promise.all(reviews.map(r => this._mapToEntity(r)));
  }

  async getAverageRating(companyId: string): Promise<number> {
    const result = await this.model.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      { $group: { _id: null, avg: { $avg: "$rating" } } }
    ]);
    return result[0]?.avg || 0;
  }

  private async _mapToEntity(doc: unknown): Promise<IReview> {
    const d = doc as {
      _id: { toString(): string };
      companyId: { toString(): string };
      userId?: { _id?: { toString(): string }; toString(): string; name?: string; profileImage?: string };
      rating: number;
      comment: string;
      createdAt: Date;
      updatedAt: Date;
    };
    const review: IReview = {
      id: d._id.toString(),
      companyId: d.companyId.toString(),
      userId: d.userId && d.userId._id ? d.userId._id.toString() : d.userId?.toString() || "",
      rating: d.rating,
      comment: d.comment,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
    
    if (d.userId && d.userId.name) {
      review.userDetails = {
        name: d.userId.name,
        profileImage: await this._resolveUserImageUrl(d.userId.profileImage)
      };
    }
    
    return review;
  }
}
