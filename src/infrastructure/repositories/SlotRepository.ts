import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import SlotConfigModel from "@/infrastructure/database/models/SlotConfigModel";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { injectable } from "inversify";

@injectable()
export class SlotRepository
  extends BaseRepository<any>
  implements ISlotRepository
{
  constructor() {
    super(SlotConfigModel);
  }

  async setConfig(config: ISlotConfig): Promise<ISlotConfig> {
    const updated = await this.model.findOneAndUpdate(
      { companyId: config.companyId },
      { $set: config },
      { upsert: true, new: true }
    ).lean();

    return this._mapToEntity(updated);
  }

  async getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null> {
    const found = await this.model.findOne({ companyId }).lean();
    if (!found) return null;
    return this._mapToEntity(found);
  }

  async deleteConfig(companyId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ companyId });
    return result.deletedCount > 0;
  }

  private _mapToEntity(doc: unknown): ISlotConfig {
    const d = doc as {
      _id: { toString(): string };
      companyId: { toString(): string };
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
      slotDuration: number;
      bufferTime: number;
      weekdays: string[];
      exceptionalDays: Date[];
      createdAt: Date;
      updatedAt: Date;
    };
    return {
      id: d._id.toString(),
      companyId: d.companyId.toString(),
      startDate: d.startDate,
      endDate: d.endDate,
      startTime: d.startTime,
      endTime: d.endTime,
      slotDuration: d.slotDuration,
      bufferTime: d.bufferTime,
      weekdays: d.weekdays,
      exceptionalDays: d.exceptionalDays,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
