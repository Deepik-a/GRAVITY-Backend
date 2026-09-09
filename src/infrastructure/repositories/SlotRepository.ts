import SlotConfigModel from "@/infrastructure/database/models/SlotConfigModel";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { injectable } from "inversify";
import mongoose from "mongoose";

@injectable()
export class SlotRepository
  implements ISlotRepository
{
  private readonly model = SlotConfigModel;
  async setConfig(config: ISlotConfig): Promise<ISlotConfig> {
    if (config.id) {
      // Update specific existing rule
      const updated = await this.model.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(config.id),
          companyId: new mongoose.Types.ObjectId(config.companyId),
        },
        { $set: config },
        { new: true }
      ).lean();

      if (!updated) {
        throw new Error("Slot rule not found to update.");
      }
      return this._mapToEntity(updated);
    }

    // Create a new slot rule document
    const created = await this.model.create({
      ...config,
      companyId: new mongoose.Types.ObjectId(config.companyId),
    });

    return this._mapToEntity(created.toObject());
  }

  async getConfigById(id: string): Promise<ISlotConfig | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const found = await this.model.findById(id).lean();
    if (!found) return null;
    return this._mapToEntity(found);
  }

  async getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null> {
    const found = await this.model
      .findOne({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ startDate: 1 })
      .lean();
    if (!found) return null;
    return this._mapToEntity(found);
  }

  async getAllConfigsByCompanyId(companyId: string): Promise<ISlotConfig[]> {
    const records = await this.model
      .find({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ startDate: 1 })
      .lean();
    return records.map((r) => this._mapToEntity(r));
  }

  async getConfigForDate(companyId: string, date: Date): Promise<ISlotConfig | null> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const found = await this.model
      .findOne({
        companyId: new mongoose.Types.ObjectId(companyId),
        startDate: { $lte: endOfDay },
        endDate: { $gte: startOfDay },
      })
      .lean();

    if (!found) return null;
    return this._mapToEntity(found);
  }

  async deleteConfig(companyId: string, ruleId?: string): Promise<boolean> {
    const query: Record<string, unknown> = {
      companyId: new mongoose.Types.ObjectId(companyId),
    };
    if (ruleId && mongoose.Types.ObjectId.isValid(ruleId)) {
      query._id = new mongoose.Types.ObjectId(ruleId);
    }
    const result = await this.model.deleteOne(query);
    return result.deletedCount > 0;
  }

  private _mapToEntity(doc: unknown): ISlotConfig {
    const d = doc as {
      _id: mongoose.Types.ObjectId;
      companyId: mongoose.Types.ObjectId;
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
