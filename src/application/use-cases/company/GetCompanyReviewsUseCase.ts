import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";

@injectable()
export class GetCompanyReviewsUseCase {
  constructor(
    @inject(TYPES.ReviewRepository) private _reviewRepository: IReviewRepository
  ) {}

  async execute(companyId: string): Promise<IReview[]> {
    return this._reviewRepository.findByCompanyId(companyId);
  }
}
