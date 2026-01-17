
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { StripeService } from "@/infrastructure/services/StripeService";
import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class CreateSubscriptionCheckoutSessionUseCase {
  constructor(
    @inject(TYPES.StripeService) private _stripeService: StripeService,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository,
    @inject(TYPES.SubscriptionRepository) private _subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(companyId: string, planId: string, successUrl: string, cancelUrl: string) {
    const company = await this._companyRepository.getProfile(companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    const plan = await this._subscriptionRepository.getPlanById(planId);
    if (!plan) {
      throw new AppError("Subscription plan not found", StatusCode.NOT_FOUND);
    }
    
    if (!plan.isActive) {
      throw new AppError("Subscription plan is not active", StatusCode.BAD_REQUEST);
    }

    const session = await this._stripeService.createSubscriptionCheckoutSession({
      amount: plan.price,
      planId: plan._id,
      companyId: companyId,
      successUrl,
      cancelUrl,
      customerEmail: company.email,
      planName: plan.name,
    });

    return session.url;
  }
}
