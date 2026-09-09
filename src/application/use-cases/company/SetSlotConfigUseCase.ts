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
      throw new AppError(
        `Active subscription required to configure slots. (isSubscribed: ${company.isSubscribed}, Status: ${sub?.status || "none"})`,
        StatusCode.FORBIDDEN
      );
    }

    if (sub?.endDate && new Date() > new Date(sub.endDate)) {
      throw new AppError("Subscription expired. Please renew to manage slots.", StatusCode.FORBIDDEN);
    }

    const toDateStr = (date: Date | string | undefined | null) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };

    // Fetch all existing rules for this company
    const companyRules = await this._slotRepository.getAllConfigsByCompanyId(config.companyId);

    // 1. EDITING an existing rule
    if (config.id) {
      const existingConfig = companyRules.find((r) => r.id === config.id);
      if (!existingConfig) {
        throw new AppError("Slot configuration not found to update.", StatusCode.NOT_FOUND);
      }

      this.validate(config, existingConfig);

      // Check overlap against other rules of this company
      const otherRules = companyRules.filter((r) => r.id !== config.id);
      for (const other of otherRules) {
        if (this.datesOverlap(config.startDate, config.endDate, other.startDate, other.endDate)) {
          throw new AppError(
            `This date range overlaps with another existing slot rule (${toDateStr(other.startDate)} - ${toDateStr(other.endDate)}).`,
            StatusCode.BAD_REQUEST
          );
        }
      }

      // Check active rule restrictions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isExpired = new Date(existingConfig.endDate) < today;

      if (!isExpired) {
        const fieldsToCheck: (keyof ISlotConfig)[] = [
          "startDate",
          "endDate",
          "startTime",
          "endTime",
          "slotDuration",
          "bufferTime",
          "weekdays",
        ];

        const hasCoreChanges = fieldsToCheck.some((field) => {
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

        const bookings = await this._bookingRepository.getCompanyBookings(config.companyId);
        const bookingCounts: Record<string, number> = {};

        bookings.forEach((b: IBooking) => {
          const dateStr = toDateStr(b.date);
          if (dateStr) {
            bookingCounts[dateStr] = (bookingCounts[dateStr] || 0) + 1;
          }
        });

        // If core scheduling fields changed, verify there are no active bookings on this rule
        if (hasCoreChanges) {
          const existingStart = new Date(existingConfig.startDate);
          const existingEnd = new Date(existingConfig.endDate);
          const hasBookingsInRule = bookings.some((b: IBooking) => {
            const bDate = new Date(b.date);
            return bDate >= existingStart && bDate <= existingEnd && b.status !== "cancelled";
          });

          if (hasBookingsInRule) {
            throw new AppError(
              "Cannot modify schedule timings or dates for an active rule with existing bookings. Only exceptional days (holidays) can be modified.",
              StatusCode.BAD_REQUEST
            );
          }
        }

        // Check for days with more than 5 bookings
        for (const exDate of config.exceptionalDays) {
          const dateStr = toDateStr(exDate);
          if (dateStr && bookingCounts[dateStr] > 5) {
            throw new AppError(
              `Cannot set ${dateStr} as holiday: it already has ${bookingCounts[dateStr]} bookings (limit is 5).`,
              StatusCode.BAD_REQUEST
            );
          }
        }
      }
    } else {
      // 2. CREATING a new rule
      if (companyRules.length >= 3) {
        throw new AppError("Maximum of 3 slot rules allowed per company.", StatusCode.BAD_REQUEST);
      }

      this.validate(config, null);

      // Check overlap against all existing rules of this company
      for (const other of companyRules) {
        if (this.datesOverlap(config.startDate, config.endDate, other.startDate, other.endDate)) {
          throw new AppError(
            `This date range overlaps with existing rule: ${toDateStr(other.startDate)} - ${toDateStr(other.endDate)}`,
            StatusCode.BAD_REQUEST
          );
        }
      }
    }

    return await this._slotRepository.setConfig(config);
  }

  private datesOverlap(
    aStart: Date | string,
    aEnd: Date | string,
    bStart: Date | string,
    bEnd: Date | string
  ): boolean {
    const aS = new Date(aStart).setHours(0, 0, 0, 0);
    const aE = new Date(aEnd).setHours(23, 59, 59, 999);
    const bS = new Date(bStart).setHours(0, 0, 0, 0);
    const bE = new Date(bEnd).setHours(23, 59, 59, 999);
    return aS <= bE && bS <= aE;
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

    if (config.slotDuration < 15) {
      throw new AppError("Slot duration must be at least 15 minutes.", StatusCode.BAD_REQUEST);
    }

    if (config.bufferTime < 10) {
      throw new AppError("Buffer time must be at least 10 minutes.", StatusCode.BAD_REQUEST);
    }

    if (config.slotDuration + config.bufferTime > endMins - startMins) {
      throw new AppError("Slot duration + buffer time cannot exceed total available time.", StatusCode.BAD_REQUEST);
    }

    if (!config.weekdays || config.weekdays.length === 0) {
      throw new AppError("At least one weekday must be selected.", StatusCode.BAD_REQUEST);
    }

    const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of config.weekdays) {
      if (!validWeekdays.includes(day)) {
        throw new AppError(`Invalid weekday: ${day}`, StatusCode.BAD_REQUEST);
      }
    }

    for (const exDate of config.exceptionalDays || []) {
      const d = new Date(exDate);
      if (d < startDate || d > endDate) {
        throw new AppError(`Exceptional day ${d.toDateString()} is outside the configured date range.`, StatusCode.BAD_REQUEST);
      }
    }
  }
}
