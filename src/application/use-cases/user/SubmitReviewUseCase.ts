import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { IReview } from "@/domain/entities/Review";
import { NotificationService } from "@/application/services/NotificationService";

import { ISubmitReviewUseCase } from "@/application/interfaces/use-cases/user/ISubmitReviewUseCase";

@injectable()
export class SubmitReviewUseCase implements ISubmitReviewUseCase {
  constructor(
    @inject(TYPES.ReviewRepository) private _reviewRepository: IReviewRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async execute(review: IReview): Promise<IReview> {
    const savedReview = await this._reviewRepository.createReview(review);

    // Notify Company
    await this._notificationService.createNotification({
      recipientId: review.companyId,
      recipientType: "company",
      title: "New Review Received",
      message: `A user has submitted a ${review.rating}-star review for your service.`,
      type: "NEW_REVIEW",
    });

    return savedReview;
  }
}
