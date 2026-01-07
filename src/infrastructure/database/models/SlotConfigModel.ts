import mongoose, { Schema, Document } from "mongoose";

export interface ISlotConfigDocument extends Document {
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
}

const SlotConfigSchema = new Schema<ISlotConfigDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, required: true },
    bufferTime: { type: Number, required: true },
    weekdays: { type: [String], required: true },
    exceptionalDays: { type: [Date], default: [] },
  },
  { timestamps: true }
);

const SlotConfigModel = mongoose.model<ISlotConfigDocument>("SlotConfig", SlotConfigSchema);
export default SlotConfigModel;
