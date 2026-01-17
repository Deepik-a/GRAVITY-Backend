
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { CreateSubscriptionPlanDto } from "@/application/dtos/subscription/CreateSubscriptionPlanDto";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

@injectable()
export class CreateSubscriptionPlanUseCase {
  constructor(
    @inject(TYPES.SubscriptionRepository) private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.subscriptionRepository.createPlan({
        ...dto,
        isActive: true
    });
  }
}
