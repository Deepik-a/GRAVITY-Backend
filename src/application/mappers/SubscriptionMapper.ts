import { SubscriptionPlan } from "@/domain/entities/SubscriptionPlan";
import { ISubscriptionPlan } from "@/infrastructure/database/models/SubscriptionPlanModel";

export const SubscriptionMapper = {
  toEntity(doc: ISubscriptionPlan): SubscriptionPlan {
    const id = doc._id as string | undefined;
    const createdAt = (doc as unknown as { createdAt: Date }).createdAt;
    const updatedAt = (doc as unknown as { updatedAt: Date }).updatedAt;

    return new SubscriptionPlan(
      id?.toString() || "",
      doc.name,
      doc.price,
      doc.duration,
      doc.description,
      doc.features,
      doc.isActive,
      createdAt,
      updatedAt
    );
  }
};
