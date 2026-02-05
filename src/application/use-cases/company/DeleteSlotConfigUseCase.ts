import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

import { IDeleteSlotConfigUseCase } from "@/application/interfaces/use-cases/company/IDeleteSlotConfigUseCase";

@injectable()
export class DeleteSlotConfigUseCase implements IDeleteSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository
  ) {}

  async execute(companyId: string): Promise<boolean> {
    return await this._slotRepository.deleteConfig(companyId);
  }
}
