
import { injectable } from "inversify";
import { ISubscriptionRepository } from "@/domain/repositories/ISubscriptionRepository";
import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";
import SubscriptionPlanModel, { ISubscriptionPlan } from "@/infrastructure/database/models/SubscriptionPlanModel";

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  
  async createPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const plan = await SubscriptionPlanModel.create(planData);
    return this.mapToEntity(plan);
  }

  async getPlans(onlyActive = false): Promise<SubscriptionPlan[]> {
    const query = onlyActive ? { isActive: true } : {};
    const plans = await SubscriptionPlanModel.find(query).sort({ price: 1 }); // Sort by price usually
    return plans.map(this.mapToEntity);
  }

  async getPlanById(id: string): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findById(id);
    return plan ? this.mapToEntity(plan) : null;
  }

  async updatePlan(id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
    const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, updates, { new: true });
    return plan ? this.mapToEntity(plan) : null;
  }

  async deletePlan(id: string): Promise<boolean> {
    const result = await SubscriptionPlanModel.findByIdAndDelete(id);
    return !!result;
  }

  private mapToEntity(doc: ISubscriptionPlan): SubscriptionPlan {
    return new SubscriptionPlan(
      (doc as any)._id.toString(),
      doc.name,
      doc.price,
      doc.duration,
      doc.description,
      doc.features,
      doc.isActive,
      (doc as any).createdAt,
      (doc as any).updatedAt
    );
  }
}
