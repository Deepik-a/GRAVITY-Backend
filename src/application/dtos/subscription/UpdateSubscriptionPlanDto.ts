export interface UpdateSubscriptionPlanDto {
  name?: string;
  price?: number;
  duration?: "monthly" | "yearly";
  description?: string;
  features?: string[];
  isActive?: boolean;
}
