import { ISlotConfig } from "@/domain/entities/SlotConfig";

export interface ISlotRepository {
  setConfig(config: ISlotConfig): Promise<ISlotConfig>;
  getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null>;
  deleteConfig(companyId: string): Promise<boolean>;
}
