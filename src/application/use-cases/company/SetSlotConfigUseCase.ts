import { ICompanyRepository } from "@/domain/repositories/ICompanyRepository";
import { ISlotRepository } from "@/domain/repositories/ISlotRepository";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { ISlotConfig } from "@/domain/entities/SlotConfig";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { AppError } from "@/shared/error/AppError";
import { StatusCode } from "@/domain/enums/StatusCode";
import { Messages } from "@/shared/constants/message";

import { ISetSlotConfigUseCase } from "@/application/interfaces/use-cases/company/ISetSlotConfigUseCase";

const MAX_SLOT_RULES = 3;

function toDateStr(date: Date | string | undefined | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  const as = toDateStr(aStart);
  const ae = toDateStr(aEnd);
  const bs = toDateStr(bStart);
  const be = toDateStr(bEnd);
  return as <= be && bs <= ae;
}

@injectable()
export class SetSlotConfigUseCase implements ISetSlotConfigUseCase {
  constructor(
    @inject(TYPES.SlotRepository) private _slotRepository: ISlotRepository,
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.CompanyRepository) private _companyRepository: ICompanyRepository
  ) {}

  async execute(config: ISlotConfig): Promise<ISlotConfig> {
    const company = await this._companyRepository.getProfile(config.companyId);
    if (!company) {
      throw new AppError(Messages.COMPANY.NOT_FOUND, StatusCode.NOT_FOUND);
    }

    const sub = company.subscription;
    if (!company.isSubscribed) {
      throw new AppError(Messages.COMPANY.SUBSCRIPTION_REQUIRED, StatusCode.FORBIDDEN);
    }

    if (sub?.endDate && new Date() > new Date(sub.endDate)) {
      throw new AppError(Messages.COMPANY.SUBSCRIPTION_EXPIRED, StatusCode.FORBIDDEN);
    }

    const normalized: ISlotConfig = {
      ...config,
      exceptionalDays: Array.isArray(config.exceptionalDays) ? config.exceptionalDays : [],
    };

    const allRules = await this._slotRepository.listConfigsByCompanyId(config.companyId);
    const existingRule = normalized.id
      ? allRules.find((r) => r.id === normalized.id) ?? null
      : null;

    if (normalized.id && !existingRule) {
      throw new AppError(Messages.SLOT.RULE_NOT_FOUND, StatusCode.NOT_FOUND);
    }

    this.validate(normalized, existingRule);

    if (!normalized.id) {
      if (allRules.length >= MAX_SLOT_RULES) {
        throw new AppError(Messages.COMPANY.SLOT_RULES_MAX, StatusCode.BAD_REQUEST);
      }
      for (const other of allRules) {
        if (
          rangesOverlap(
            new Date(normalized.startDate),
            new Date(normalized.endDate),
            new Date(other.startDate),
            new Date(other.endDate)
          )
        ) {
          throw new AppError(Messages.COMPANY.SLOT_RULE_DATE_OVERLAP, StatusCode.BAD_REQUEST);
        }
      }
    } else if (existingRule) {
      const others = allRules.filter((r) => r.id !== normalized.id);
      for (const other of others) {
        if (
          rangesOverlap(
            new Date(normalized.startDate),
            new Date(normalized.endDate),
            new Date(other.startDate),
            new Date(other.endDate)
          )
        ) {
          throw new AppError(Messages.COMPANY.SLOT_RULE_DATE_OVERLAP, StatusCode.BAD_REQUEST);
        }
      }
    }

    if (existingRule) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isExpired = new Date(existingRule.endDate) < today;

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

        const hasOtherChanges = fieldsToCheck.some((field) => {
          const oldValue = existingRule[field as keyof typeof existingRule];
          const newValue = normalized[field as keyof typeof normalized];

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
          throw new AppError(Messages.COMPANY.ACTIVE_RULE_ONLY_EXCEPTIONS, StatusCode.BAD_REQUEST);
        }

        const bookings = await this._bookingRepository.getCompanyBookings(config.companyId);
        const bookingCounts: Record<string, number> = {};

        bookings.forEach((b: IBooking) => {
          const dateStr = toDateStr(b.date);
          if (dateStr) {
            bookingCounts[dateStr] = (bookingCounts[dateStr] || 0) + 1;
          }
        });

        const startDate = new Date(normalized.startDate);
        const endDate = new Date(normalized.endDate);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = toDateStr(d);
          if (dateStr && bookingCounts[dateStr] > 5) {
            throw new AppError(
              Messages.COMPANY.EDITING_LIMIT_REACHED(dateStr, bookingCounts[dateStr]),
              StatusCode.BAD_REQUEST
            );
          }
        }
      }
    }

    try {
      return await this._slotRepository.setConfig(normalized);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SLOT_RULE_NOT_FOUND") {
        throw new AppError(Messages.SLOT.RULE_NOT_FOUND, StatusCode.NOT_FOUND);
      }
      throw e;
    }
  }

  private validate(config: ISlotConfig, existingConfig: ISlotConfig | null) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    const toDateStrIso = (date: Date | string) => toDateStr(date);

    if (!existingConfig || toDateStrIso(existingConfig.startDate) !== toDateStrIso(config.startDate)) {
      if (startDate < now) {
        throw new AppError(Messages.COMPANY.START_DATE_PAST, StatusCode.BAD_REQUEST);
      }
    }

    if (endDate <= startDate) {
      throw new AppError(Messages.COMPANY.END_DATE_INVALID, StatusCode.BAD_REQUEST);
    }

    const startArr = config.startTime.split(":").map(Number);
    const endArr = config.endTime.split(":").map(Number);
    const startMins = startArr[0] * 60 + startArr[1];
    const endMins = endArr[0] * 60 + endArr[1];

    if (endMins <= startMins) {
      throw new AppError(Messages.COMPANY.END_TIME_INVALID, StatusCode.BAD_REQUEST);
    }

    if (config.slotDuration <= 0) {
      throw new AppError(Messages.COMPANY.SLOT_DURATION_INVALID, StatusCode.BAD_REQUEST);
    }

    if (config.bufferTime < 0) {
      throw new AppError(Messages.COMPANY.BUFFER_TIME_NEGATIVE, StatusCode.BAD_REQUEST);
    }

    if (config.slotDuration + config.bufferTime > endMins - startMins) {
      throw new AppError(Messages.COMPANY.SLOT_DURATION_BUFFER_EXCEEDS_TOTAL, StatusCode.BAD_REQUEST);
    }

    if (config.weekdays.length === 0) {
      throw new AppError(Messages.COMPANY.WEEKDAY_REQUIRED, StatusCode.BAD_REQUEST);
    }

    const validWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    for (const day of config.weekdays) {
      if (!validWeekdays.includes(day)) {
        throw new AppError(Messages.COMPANY.INVALID_WEEKDAY(day), StatusCode.BAD_REQUEST);
      }
    }

    const exceptional = config.exceptionalDays ?? [];
    for (const exDate of exceptional) {
      const d = new Date(exDate);
      if (Number.isNaN(d.getTime())) {
        throw new AppError(Messages.COMPANY.EXCEPTIONAL_DAY_INVALID, StatusCode.BAD_REQUEST);
      }
      if (d < startDate || d > endDate) {
        throw new AppError(Messages.COMPANY.EXCEPTIONAL_DAY_OUTSIDE_RANGE(d.toDateString()), StatusCode.BAD_REQUEST);
      }
      const dayName = d.toLocaleString("en-US", { weekday: "long" });
      if (!config.weekdays.includes(dayName)) {
        throw new AppError(
          Messages.COMPANY.EXCEPTIONAL_DAY_NOT_ON_AVAILABLE_WEEKDAY(dayName),
          StatusCode.BAD_REQUEST
        );
      }
    }
  }
}
