
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";

export interface ISubscriptionRepository {
  createPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  getPlans(onlyActive?: boolean): Promise<SubscriptionPlan[]>;
  getPlanById(id: string): Promise<SubscriptionPlan | null>;
  updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null>;
  deletePlan(id: string): Promise<boolean>;
}
