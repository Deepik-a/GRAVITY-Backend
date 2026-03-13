import { injectable } from "inversify";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";
import SubscriptionPlanModel from "@/infrastructure/database/models/SubscriptionPlanModel";
import { CreateSubscriptionPlanDto } from "@/application/dtos/subscription/CreateSubscriptionPlanDto";
import { UpdateSubscriptionPlanDto } from "@/application/dtos/subscription/UpdateSubscriptionPlanDto";
import { SubscriptionMapper } from "@/application/mappers/SubscriptionMapper";

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  
  async createPlan(planData: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await SubscriptionPlanModel.create(planData);
    return SubscriptionMapper.toEntity(plan);
  }

  async getPlans(onlyActive = false): Promise<SubscriptionPlan[]> {
    const query = onlyActive ? { isActive: true } : {};
    const plans = await SubscriptionPlanModel.find(query).sort({ price: 1 });
    return plans.map(SubscriptionMapper.toEntity);
  }

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findById(id);
    return plan ? SubscriptionMapper.toEntity(plan) : null;
  }

  async updatePlan(id: string, updates: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, updates, { new: true });
    return plan ? SubscriptionMapper.toEntity(plan) : null;
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await SubscriptionPlanModel.findByIdAndDelete(id);
    return !!result;
  }
}
