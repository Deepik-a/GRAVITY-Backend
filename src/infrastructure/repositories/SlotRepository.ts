import SlotConfigModel from "@/infrastructure/database/models/SlotConfigModel";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { injectable } from "inversify";
import mongoose from "mongoose";

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

@injectable()
export class SlotRepository implements ISlotRepository {
  private readonly model = SlotConfigModel;

  async setConfig(config: ISlotConfig): Promise<ISlotConfig> {
    const companyOid = new mongoose.Types.ObjectId(config.companyId);
    const payload = {
      companyId: companyOid,
      startDate: config.startDate,
      endDate: config.endDate,
      startTime: config.startTime,
      endTime: config.endTime,
      slotDuration: config.slotDuration,
      bufferTime: config.bufferTime,
      weekdays: config.weekdays,
      exceptionalDays: config.exceptionalDays ?? [],
    };

    if (config.id) {
      const updated = await this.model
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(config.id), companyId: companyOid },
          { $set: payload },
          { new: true }
        )
        .lean();
      if (!updated) {
        throw new Error("SLOT_RULE_NOT_FOUND");
      }
      return this._mapToEntity(updated);
    }

    const created = await this.model.create(payload);
    const doc = typeof created.toObject === "function" ? created.toObject() : created;
    return this._mapToEntity(doc);
  }

  async listConfigsByCompanyId(companyId: string): Promise<ISlotConfig[]> {
    const docs = await this.model
      .find({ companyId: new mongoose.Types.ObjectId(companyId) })
      .sort({ startDate: 1 })
      .lean();
    return docs.map((d) => this._mapToEntity(d));
  }

  async getConfigByCompanyId(companyId: string): Promise<ISlotConfig | null> {
    const list = await this.listConfigsByCompanyId(companyId);
    if (list.length === 0) return null;
    return list[0];
  }

  async getConfigForCompanyOnDate(companyId: string, date: Date): Promise<ISlotConfig | null> {
    const dayStr = toYmdLocal(date);
    const list = await this.listConfigsByCompanyId(companyId);
    const dayName = date.toLocaleString("en-US", { weekday: "long" });

    for (const c of list) {
      const startStr = toYmdLocal(new Date(c.startDate));
      const endStr = toYmdLocal(new Date(c.endDate));
      if (dayStr < startStr || dayStr > endStr) continue;
      if (!c.weekdays.includes(dayName)) continue;

      const ex = c.exceptionalDays ?? [];
      const isExceptional = ex.some((exd) => toYmdLocal(new Date(exd)) === dayStr);
      if (isExceptional) continue;

      return c;
    }
    return null;
  }

  async deleteConfigById(companyId: string, ruleId: string): Promise<boolean> {
    const result = await this.model.deleteOne({
      _id: new mongoose.Types.ObjectId(ruleId),
      companyId: new mongoose.Types.ObjectId(companyId),
    });
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
      exceptionalDays: d.exceptionalDays ?? [],
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
