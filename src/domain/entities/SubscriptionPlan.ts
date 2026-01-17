
export class SubscriptionPlan {
  constructor(
    public readonly _id: string,
    public name: string,
    public price: number,
    public duration: "monthly" | "yearly",
    public description: string,
    public features: string[],
    public isActive: boolean,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}
