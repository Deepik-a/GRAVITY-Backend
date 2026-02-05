import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

export interface IGetSubscriptionPlansUseCase {
  execute(onlyActive?: boolean): Promise<SubscriptionPlan[]>;
}
