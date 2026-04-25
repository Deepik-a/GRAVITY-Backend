import { ISlotConfig } from "@/domain/entities/SlotConfig";

export interface ISlotRepository {
  setConfig(config: ISlotConfig): Promise<ISlotConfig>;
  /** @deprecated Prefer listConfigsByCompanyId */
  getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null>;
  listConfigsByCompanyId(companyId: string): Promise<ISlotConfig[]>;
  /** Rule that applies to this calendar date (range + weekday + not exceptional), or null */
  getConfigForCompanyOnDate(companyId: string, date: Date): Promise<ISlotConfig | null>;
  deleteConfigById(companyId: string, ruleId: string): Promise<boolean>;
}
