import { Request, Response } from "express";
import { AppError } from "@/shared/error/AppError";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { SetSlotConfigUseCase } from "@/application/use-cases/company/SetSlotConfigUseCase";
import { GetSlotConfigUseCase } from "@/application/use-cases/company/GetSlotConfigUseCase";
import { DeleteSlotConfigUseCase } from "@/application/use-cases/company/DeleteSlotConfigUseCase";
import { GetAvailableSlotsUseCase } from "@/application/use-cases/user/GetAvailableSlotsUseCase";
import { BookSlotUseCase } from "@/application/use-cases/user/BookSlotUseCase";
import { GetUserBookingsUseCase } from "@/application/use-cases/user/GetUserBookingsUseCase";
import { GetCompanyBookingsUseCase } from "@/application/use-cases/company/GetCompanyBookingsUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { AuthenticatedUser } from "@/types/auth";

@injectable()
export class SlotController {
  constructor(
    @inject(TYPES.SetSlotConfigUseCase) private _setSlotConfigUseCase: SetSlotConfigUseCase,
    @inject(TYPES.GetSlotConfigUseCase) private _getSlotConfigUseCase: GetSlotConfigUseCase,
    @inject(TYPES.DeleteSlotConfigUseCase) private _deleteSlotConfigUseCase: DeleteSlotConfigUseCase,
    @inject(TYPES.GetAvailableSlotsUseCase) private _getAvailableSlotsUseCase: GetAvailableSlotsUseCase,
    @inject(TYPES.BookSlotUseCase) private _bookSlotUseCase: BookSlotUseCase,
    @inject(TYPES.GetCompanyBookingsUseCase) private _getCompanyBookingsUseCase: GetCompanyBookingsUseCase,
    @inject(TYPES.GetUserBookingsUseCase) private _getUserBookingsUseCase: GetUserBookingsUseCase
  ) {}

  async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AuthenticatedUser)?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }
      const bookings = await this._getUserBookingsUseCase.execute(userId);
      res.status(StatusCode.SUCCESS).json(bookings);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async getCompanyBookings(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.user as AuthenticatedUser)?.id;
      if (!companyId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
        return;
      }
      const bookings = await this._getCompanyBookingsUseCase.execute(companyId);
      res.status(StatusCode.SUCCESS).json(bookings);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async setConfig(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.user as AuthenticatedUser)?.id; // Assuming user info is in req.user from middleware
      if (!companyId) {
         res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
         return;
      }
      const config = await this._setSlotConfigUseCase.execute({ ...req.body, companyId });
      res.status(StatusCode.SUCCESS).json(config);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.user as AuthenticatedUser)?.id;
      if (!companyId) {
         res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
         return;
      }
      const config = await this._getSlotConfigUseCase.execute(companyId);
      res.status(StatusCode.SUCCESS).json(config);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async deleteConfig(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req.user as AuthenticatedUser)?.id;
      if (!companyId) {
         res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
         return;
      }
      await this._deleteSlotConfigUseCase.execute(companyId);
      res.status(StatusCode.SUCCESS).json({ message: "Slot configuration deleted successfully" });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, date } = req.query;
      if (!companyId || !date) {
        res.status(StatusCode.BAD_REQUEST).json({ message: "companyId and date are required" });
        return;
      }
      const slots = await this._getAvailableSlotsUseCase.execute(companyId as string, date as string);
      res.status(StatusCode.SUCCESS).json(slots);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async bookSlot(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AuthenticatedUser)?.id;
      if (!userId) {
         res.status(StatusCode.UNAUTHORIZED).json({ message: "Unauthorized" });
         return;
      }
      const booking = await this._bookSlotUseCase.execute({ ...req.body, userId });
      res.status(StatusCode.CREATED).json(booking);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }
}
