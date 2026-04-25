import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IGetSlotConfigUseCase } from "@/application/interfaces/use-cases/company/IGetSlotConfigUseCase";

@injectable()
export class GetSlotConfigUseCase implements IGetSlotConfigUseCase {
  constructor(@inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository) {}

  async execute(companyId: string): Promise<ISlotConfig[]> {
    return await this._slotRepository.listConfigsByCompanyId(companyId);
  }
}
