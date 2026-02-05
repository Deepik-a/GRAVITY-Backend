import { IReview } from "@/domain/entities/Review";

export interface ISubmitReviewUseCase {
  execute(review: IReview): Promise<IReview>;
}
