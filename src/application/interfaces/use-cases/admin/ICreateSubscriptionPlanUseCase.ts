import { CreateSubscriptionPlanDto } from "@/application/dtos/subscription/CreateSubscriptionPlanDto";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

export interface ICreateSubscriptionPlanUseCase {
  execute(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan>;
}
