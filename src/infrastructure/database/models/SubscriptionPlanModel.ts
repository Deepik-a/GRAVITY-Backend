
import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  price: number;
  duration: "monthly" | "yearly";
  description: string;
  features: string[];
  isActive: boolean;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, enum: ["monthly", "yearly"], required: true },
    description: { type: String, required: true },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);
export default SubscriptionPlanModel;
