import { ISlotConfig } from "@/domain/entities/SlotConfig";

export interface ISetSlotConfigUseCase {
  execute(config: ISlotConfig): Promise<ISlotConfig>;
}
