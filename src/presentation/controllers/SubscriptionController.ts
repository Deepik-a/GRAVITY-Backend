
import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ICreateSubscriptionPlanUseCase } from "@/application/interfaces/use-cases/admin/ICreateSubscriptionPlanUseCase";
import { IGetSubscriptionPlansUseCase } from "@/application/interfaces/use-cases/subscription/IGetSubscriptionPlansUseCase";

@injectable()
export class SubscriptionController {
  constructor(
    @inject(TYPES.CreateSubscriptionPlanUseCase) private createPlanUseCase: ICreateSubscriptionPlanUseCase,
    @inject(TYPES.GetSubscriptionPlansUseCase) private getPlansUseCase: IGetSubscriptionPlansUseCase
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
