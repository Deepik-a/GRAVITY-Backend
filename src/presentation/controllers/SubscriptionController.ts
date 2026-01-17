
import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { CreateSubscriptionPlanUseCase } from "@/application/use-cases/admin/CreateSubscriptionPlanUseCase";
import { GetSubscriptionPlansUseCase } from "@/application/use-cases/subscription/GetSubscriptionPlansUseCase";

@injectable()
export class SubscriptionController {
  constructor(
    @inject(TYPES.CreateSubscriptionPlanUseCase) private createPlanUseCase: CreateSubscriptionPlanUseCase,
    @inject(TYPES.GetSubscriptionPlansUseCase) private getPlansUseCase: GetSubscriptionPlansUseCase
  ) {}

  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await this.createPlanUseCase.execute(req.body);
      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const onlyActive = req.query.active !== 'false';
      const plans = await this.getPlansUseCase.execute(onlyActive);
      res.status(200).json(plans);
    } catch (error) {
      next(error);
    }
  }
}
