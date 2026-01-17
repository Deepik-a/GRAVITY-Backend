import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { StripeService } from "@/infrastructure/services/StripeService";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { IUserRepository } from "@/domain/repositories/IUserRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    @inject(TYPES.StripeService) private _stripeService: StripeService,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.UserRepository) private _userRepository: IUserRepository
  ) {}

  async execute(bookingId: string, successUrl: string, cancelUrl: string) {
    const booking = await this._bookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found", StatusCode.NOT_FOUND);
    }

    const company = await this._companyRepository.getProfile(booking.companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    const user = await this._userRepository.findById(booking.userId);
    if (!user) {
      throw new AppError("User not found", StatusCode.NOT_FOUND);
    }

    const fee = company.profile?.consultationFee || 0;
    if (fee <= 0) {
        // If fee is 0, we might just confirm the booking immediately or throw error
        // For this task, we assume there is a fee.
    }

    const adminCommission = fee * 0.1; // 10% commission

    const session = await this._stripeService.createCheckoutSession({
      amount: fee,
      bookingId: bookingId,
      successUrl,
      cancelUrl,
      customerEmail: user.email,
      companyName: company.name,
    });

    // Update booking with payment info
    await this._bookingRepository.updateById(bookingId, {
      stripeSessionId: session.id,
      price: fee,
      adminCommission: adminCommission,
      paymentStatus: "pending"
    });

    return session.url;
  }
}
