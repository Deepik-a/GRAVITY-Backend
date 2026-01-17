import { IReview } from "@/domain/entities/Review";

export interface IReviewRepository {
  createReview(review: IReview): Promise<IReview>;
  findByCompanyId(companyId: string): Promise<IReview[]>;
}
