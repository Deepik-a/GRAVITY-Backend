import { IReview } from "@/domain/entities/Review";

export interface IGetCompanyReviewsUseCase {
  execute(companyId: string): Promise<IReview[]>;
}
