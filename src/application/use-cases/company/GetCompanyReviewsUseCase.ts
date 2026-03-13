import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";

import { IGetCompanyReviewsUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyReviewsUseCase";

@injectable()
export class GetCompanyReviewsUseCase implements IGetCompanyReviewsUseCase {
  constructor(
    @inject(TYPES.ReviewRepository) private _reviewRepository: IReviewRepository
  ) {}

  async execute(companyId: string): Promise<IReview[]> {
    return this._reviewRepository.findByCompanyId(companyId);
  }
}
