import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";

@injectable()
export class DeleteSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository
  ) {}

  async execute(companyId: string): Promise<boolean> {
    return await this._slotRepository.deleteConfig(companyId);
  }
}
