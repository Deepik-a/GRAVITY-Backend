import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISubmitReviewUseCase } from "@/application/interfaces/use-cases/user/ISubmitReviewUseCase";
import { IGetCompanyReviewsUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyReviewsUseCase";
import { AuthenticatedUser } from "@/types/auth";

@injectable()
export class ReviewController {
  constructor(
    @inject(TYPES.SubmitReviewUseCase) private _submitReviewUseCase: ISubmitReviewUseCase,
    @inject(TYPES.GetCompanyReviewsUseCase) private _getCompanyReviewsUseCase: IGetCompanyReviewsUseCase
  ) {}

  async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewData = {
        ...req.body,
        userId: (req.user as AuthenticatedUser)?.id, // populates from AuthMiddleware
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
