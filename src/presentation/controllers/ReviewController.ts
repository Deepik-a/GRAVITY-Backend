import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { SubmitReviewUseCase } from "@/application/use-cases/user/SubmitReviewUseCase";
import { GetCompanyReviewsUseCase } from "@/application/use-cases/company/GetCompanyReviewsUseCase";

@injectable()
export class ReviewController {
  constructor(
    @inject(TYPES.SubmitReviewUseCase) private _submitReviewUseCase: SubmitReviewUseCase,
    @inject(TYPES.GetCompanyReviewsUseCase) private _getCompanyReviewsUseCase: GetCompanyReviewsUseCase
  ) {}

  async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewData = {
        ...req.body,
        userId: (req as any).user.id, // Assuming AuthMiddleware populates this
      };
      const result = await this._submitReviewUseCase.execute(reviewData);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const result = await this._getCompanyReviewsUseCase.execute(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
