import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";

import { ISetSlotConfigUseCase } from "@/application/interfaces/use-cases/company/ISetSlotConfigUseCase";

@injectable()
export class SetSlotConfigUseCase implements ISetSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(config: ISlotConfig): Promise<ISlotConfig> {
    // 0. Check Company Subscription
    const company = await this._companyRepository.getProfile(config.companyId);
    if (!company) {
      throw new AppError("Company not found", StatusCode.NOT_FOUND);
    }

    const sub = company.subscription;
    if (!company.isSubscribed) {
      throw new AppError(`Active subscription required to configure slots. (isSubscribed: ${company.isSubscribed}, Status: ${sub?.status || "none"})`, StatusCode.FORBIDDEN);
    }

    if (sub?.endDate && new Date() > new Date(sub.endDate)) {
        throw new AppError("Subscription expired. Please renew to manage slots.", StatusCode.FORBIDDEN);
    }


    const existingConfig = await this._slotRepository.getConfigByCompanyId(config.companyId);
    
    // 1. Validations (passing existingConfig to allow historical dates)
    this.validate(config, existingConfig);

    const toDateStr = (date: Date | string | undefined | null) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };

    // 2. Editing restrictions for existing config
    if (existingConfig) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isExpired = new Date(existingConfig.endDate) < today;

      if (!isExpired) {
        // Check if fields other than exceptionalDays have changed
        const fieldsToCheck: (keyof ISlotConfig)[] = [
          "startDate", "endDate", "startTime", "endTime", "slotDuration", "bufferTime", "weekdays"
        ];
        
        const hasOtherChanges = fieldsToCheck.some(field => {
          const oldValue = existingConfig[field as keyof typeof existingConfig];
          const newValue = config[field as keyof typeof config];
          
          if (field === "weekdays") {
            const oldArr = Array.isArray(oldValue) ? oldValue : [];
            const newArr = Array.isArray(newValue) ? newValue : [];
            return JSON.stringify([...oldArr].sort()) !== JSON.stringify([...newArr].sort());
          }
          
          if (field === "startDate" || field === "endDate") {
              return toDateStr(oldValue as string | Date) !== toDateStr(newValue as string | Date);
          }
  
          return String(oldValue ?? "") !== String(newValue ?? "");
        });
  
        if (hasOtherChanges) {
          throw new AppError(
            "Only exceptional days (holidays) can be modified for an active rule. To create a new rule, wait until the current one expires.",
            StatusCode.BAD_REQUEST
          );
        }
  
        // Check for days with more than 5 bookings in the range
        const bookings = await this._bookingRepository.getCompanyBookings(config.companyId);
        const bookingCounts: Record<string, number> = {};
        
        bookings.forEach((b: IBooking) => {
          const dateStr = toDateStr(b.date);
          if (dateStr) {
            bookingCounts[dateStr] = (bookingCounts[dateStr] || 0) + 1;
          }
        });
  
        const startDate = new Date(config.startDate);
        const endDate = new Date(config.endDate);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = toDateStr(d);
          if (dateStr && bookingCounts[dateStr] > 5) {
            throw new AppError(
              `Editing is not possible: ${dateStr} already has ${bookingCounts[dateStr]} bookings (limit is 5).`,
              StatusCode.BAD_REQUEST
            );
          }
        }
      }
    }

    return await this._slotRepository.setConfig(config);
  }

  private validate(config: ISlotConfig, existingConfig: ISlotConfig | null) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    const toDateStr = (date: Date | string) => new Date(date).toISOString().split("T")[0];

    // Only block past start date if it's a new config or the start date is being changed
    if (!existingConfig || toDateStr(existingConfig.startDate) !== toDateStr(config.startDate)) {
        if (startDate < now) {
            throw new AppError("Start date cannot be in the past.", StatusCode.BAD_REQUEST);
        }
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
