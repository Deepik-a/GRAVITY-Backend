import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import ReviewModel, { IReviewDocument } from "@/infrastructure/database/models/ReviewModel";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";
import { injectable } from "inversify";

@injectable()
export class ReviewRepository extends BaseRepository<IReviewDocument> implements IReviewRepository {
  constructor() {
    super(ReviewModel);
  }

  async createReview(review: IReview): Promise<IReview> {
    const created = await this.model.create(review);
    return this._mapToEntity(created.toObject());
  }

  async findByCompanyId(companyId: string): Promise<IReview[]> {
    const reviews = await this.model.find({ companyId })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();
    return reviews.map(r => this._mapToEntity(r));
  }

  private _mapToEntity(doc: unknown): IReview {
    const d = doc as any;
    const review: IReview = {
      id: d._id.toString(),
      companyId: d.companyId.toString(),
      userId: d.userId._id ? d.userId._id.toString() : d.userId.toString(),
      rating: d.rating,
      comment: d.comment,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
    
    if (d.userId && d.userId.name) {
      review.userDetails = {
        name: d.userId.name,
        profileImage: d.userId.profileImage
      };
    }
    
    return review;
  }
}
