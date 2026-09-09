import { ISlotConfig } from "@/domain/entities/SlotConfig";

export interface IGetSlotConfigUseCase {
  execute(companyId: string): Promise<ISlotConfig[]>;
}
