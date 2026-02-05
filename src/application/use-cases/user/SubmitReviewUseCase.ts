import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";

import { ISubmitReviewUseCase } from "@/application/interfaces/use-cases/user/ISubmitReviewUseCase";

@injectable()
export class SubmitReviewUseCase implements ISubmitReviewUseCase {
  constructor(
    @inject(TYPES.ReviewRepository) private _reviewRepository: IReviewRepository
  ) {}

  async execute(review: IReview): Promise<IReview> {
    return this._reviewRepository.createReview(review);
  }
}
