import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";
import { CreateSubscriptionPlanDto } from "@/application/dtos/subscription/CreateSubscriptionPlanDto";
import { UpdateSubscriptionPlanDto } from "@/application/dtos/subscription/UpdateSubscriptionPlanDto";

export interface ISubscriptionRepository {
  createPlan(planData: CreateSubscriptionPlanDto): Promise<SubscriptionPlan>;
  getPlans(onlyActive?: boolean): Promise<SubscriptionPlan[]>;
  getPlanById(id: string): Promise<SubscriptionPlan | null>;
  updatePlan(id: string, updates: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
}
