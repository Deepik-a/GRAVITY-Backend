import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ITransactionRepository } from "@/domain/repositories/ITransactionRepository";
import { IReviewRepository } from "@/domain/repositories/IReviewRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class GetCompanyDashboardStatsUseCase {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.TransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ReviewRepository) private _reviewRepository: IReviewRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(companyId: string) {
    const company = await this._companyRepository.findCompanyById(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    const [bookingStats, transactionStats, averageRating] = await Promise.all([
      this._bookingRepository.getStats(companyId),
      this._transactionRepository.getCompanyDashboardStats(companyId),
      this._reviewRepository.getAverageRating(companyId)
    ]);

    return {
      totalConsultations: bookingStats.totalConsultations,
      completedProjects: bookingStats.completedProjects,
      monthlyEarnings: transactionStats.monthlyEarnings,
      averageRating: averageRating,
      statusBreakdown: bookingStats.statusBreakdown,
      revenueTrends: transactionStats.revenueTrends,
      walletBalance: company.walletBalance || 0,
      isSubscribed: !!company.isSubscribed,
      documentStatus: company.documentStatus
    };
  }
}
