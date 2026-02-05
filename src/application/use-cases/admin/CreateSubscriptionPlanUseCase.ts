
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { CreateSubscriptionPlanDto } from "@/application/dtos/subscription/CreateSubscriptionPlanDto";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

import { ICreateSubscriptionPlanUseCase } from "@/application/interfaces/use-cases/admin/ICreateSubscriptionPlanUseCase";

@injectable()
export class CreateSubscriptionPlanUseCase implements ICreateSubscriptionPlanUseCase {
  constructor(
    @inject(TYPES.SubscriptionRepository) private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const allowedNames = ["basic plan", "upgrade plan", "premium plan"];
    if (!allowedNames.includes(dto.name)) {
        throw new Error(`Invalid plan name. Allowed names are: ${allowedNames.join(", ")}`);
    }

    return this.subscriptionRepository.createPlan({
        ...dto,
        isActive: true
    });
  }
}
