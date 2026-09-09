import { ISlotConfig } from "@/domain/entities/SlotConfig";

export interface ISlotRepository {
  setConfig(config: ISlotConfig): Promise<ISlotConfig>;
  getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null>;
  getAllConfigsByCompanyId(companyId: string): Promise<ISlotConfig[]>;
  getConfigById(id: string): Promise<ISlotConfig | null>;
  getConfigForDate(companyId: string, date: Date): Promise<ISlotConfig | null>;
  deleteConfig(companyId: string, ruleId?: string): Promise<boolean>;
}
