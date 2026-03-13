
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

import { IGetSubscriptionPlansUseCase } from "@/application/interfaces/use-cases/subscription/IGetSubscriptionPlansUseCase";

@injectable()
export class GetSubscriptionPlansUseCase implements IGetSubscriptionPlansUseCase {
  constructor(
    @inject(TYPES.SubscriptionRepository) private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(onlyActive = true): Promise<SubscriptionPlan[]> {
    return this.subscriptionRepository.getPlans(onlyActive);
  }
}
