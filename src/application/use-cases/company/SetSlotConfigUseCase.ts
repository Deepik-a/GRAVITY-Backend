import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

@injectable()
export class SetSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository
  ) {}

  async execute(config: ISlotConfig): Promise<ISlotConfig> {
    // 1. Validations
    this.validate(config);

    // 2. 5-Minute Rule Check
    const existingConfig = await this._slotRepository.getConfigByCompanyId(config.companyId);
    if (existingConfig && existingConfig.createdAt) {
      const now = new Date();
      const createdAt = new Date(existingConfig.createdAt);
      const diffInMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffInMinutes > 5) {
        throw new AppError(
          "Editing of slot rules is only allowed within 5 minutes of creation. Please delete and create a new rule if needed.",
          StatusCode.BAD_REQUEST
        );
      }
    }

    return await this._slotRepository.setConfig(config);
  }

  private validate(config: ISlotConfig) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    if (startDate < now) {
      throw new AppError("Start date cannot be in the past.", StatusCode.BAD_REQUEST);
    }

    if (endDate <= startDate) {
      throw new AppError("End date must be after start date.", StatusCode.BAD_REQUEST);
    }

    const startArr = config.startTime.split(":").map(Number);
    const endArr = config.endTime.split(":").map(Number);
    const startMins = startArr[0] * 60 + startArr[1];
    const endMins = endArr[0] * 60 + endArr[1];

    if (endMins <= startMins) {
      throw new AppError("End time must be after start time.", StatusCode.BAD_REQUEST);
    }

    if (config.slotDuration <= 0) {
      throw new AppError("Slot duration must be greater than 0.", StatusCode.BAD_REQUEST);
    }

    if (config.bufferTime < 0) {
      throw new AppError("Buffer time cannot be negative.", StatusCode.BAD_REQUEST);
    }

    if (config.slotDuration + config.bufferTime > endMins - startMins) {
      throw new AppError("Slot duration + buffer time cannot exceed total available time.", StatusCode.BAD_REQUEST);
    }

    if (config.weekdays.length === 0) {
      throw new AppError("At least one weekday must be selected.", StatusCode.BAD_REQUEST);
    }

    const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of config.weekdays) {
      if (!validWeekdays.includes(day)) {
        throw new AppError(`Invalid weekday: ${day}`, StatusCode.BAD_REQUEST);
      }
    }

    for (const exDate of config.exceptionalDays) {
      const d = new Date(exDate);
      if (d < startDate || d > endDate) {
        throw new AppError(`Exceptional day ${d.toDateString()} is outside the configured date range.`, StatusCode.BAD_REQUEST);
      }
    }
  }
}
