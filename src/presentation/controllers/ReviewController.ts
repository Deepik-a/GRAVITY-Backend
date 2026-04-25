import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISubmitReviewUseCase } from "@/application/interfaces/use-cases/user/ISubmitReviewUseCase";
import { IGetCompanyReviewsUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyReviewsUseCase";
import { AuthenticatedUser } from "@/types/auth";
import BookingModel from "@/infrastructure/database/models/BookingModel";
import { StatusCode } from "@/domain/enums/StatusCode";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

@injectable()
export class ReviewController {
  constructor(
    @inject(TYPES.SubmitReviewUseCase) private _submitReviewUseCase: ISubmitReviewUseCase,
    @inject(TYPES.GetCompanyReviewsUseCase) private _getCompanyReviewsUseCase: IGetCompanyReviewsUseCase
  ) {}

  async submitReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as AuthenticatedUser)?.id;
      const companyId = (req.params.companyId as string) || req.body.companyId;

      const eligible = await BookingModel.exists({
        userId,
        companyId,
        serviceStatus: "completed",
        paymentStatus: PaymentStatus.PAID,
      });

      if (!eligible) {
        res.status(StatusCode.FORBIDDEN).json({
          message: "You can only review a company after completing a paid consultation.",
        });
        return;
      }

      const reviewData = {
        ...req.body,
        companyId,
        userId, // populates from AuthMiddleware
      };
      const result = await this._submitReviewUseCase.execute(reviewData);
      res.status(StatusCode.CREATED).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const result = await this._getCompanyReviewsUseCase.execute(companyId as string);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error) {
      next(error);
    }
  }
}
