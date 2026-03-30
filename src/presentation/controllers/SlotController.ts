import { Request, Response } from "express";
import { AppError } from "@/shared/error/AppError";
import { inject, injectable } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { ISetSlotConfigUseCase } from "@/application/interfaces/use-cases/company/ISetSlotConfigUseCase";
import { IGetSlotConfigUseCase } from "@/application/interfaces/use-cases/company/IGetSlotConfigUseCase";
import { IDeleteSlotConfigUseCase } from "@/application/interfaces/use-cases/company/IDeleteSlotConfigUseCase";
import { IGetAvailableSlotsUseCase } from "@/application/interfaces/use-cases/user/IGetAvailableSlotsUseCase";
import { IBookSlotUseCase } from "@/application/interfaces/use-cases/user/IBookSlotUseCase";
import { IGetUserBookingsUseCase } from "@/application/interfaces/use-cases/user/IGetUserBookingsUseCase";
import { IGetCompanyBookingsUseCase } from "@/application/interfaces/use-cases/company/IGetCompanyBookingsUseCase";
import { IGetAllBookingsUseCase } from "@/application/interfaces/use-cases/admin/IGetAllBookingsUseCase";
import { ICompleteBookingUseCase } from "@/application/interfaces/use-cases/user/ICompleteBookingUseCase";
import { IRescheduleBookingUseCase } from "@/application/interfaces/use-cases/company/IRescheduleBookingUseCase";
import { ICancelBookingUseCase } from "@/application/interfaces/use-cases/company/ICancelBookingUseCase";
import { IRefundBookingUseCase } from "@/application/use-cases/admin/RefundBookingUseCase";
import { StatusCode } from "@/domain/enums/StatusCode";
import { AuthenticatedUser } from "@/types/auth";
import { Messages } from "@/shared/constants/message";

@injectable()
export class SlotController {
  constructor(
    @inject(TYPES.SetSlotConfigUseCase) private _setSlotConfigUseCase: ISetSlotConfigUseCase,
    @inject(TYPES.GetSlotConfigUseCase) private _getSlotConfigUseCase: IGetSlotConfigUseCase,
    @inject(TYPES.DeleteSlotConfigUseCase) private _deleteSlotConfigUseCase: IDeleteSlotConfigUseCase,
    @inject(TYPES.GetAvailableSlotsUseCase) private _getAvailableSlotsUseCase: IGetAvailableSlotsUseCase,
    @inject(TYPES.BookSlotUseCase) private _bookSlotUseCase: IBookSlotUseCase,
    @inject(TYPES.GetCompanyBookingsUseCase) private _getCompanyBookingsUseCase: IGetCompanyBookingsUseCase,
    @inject(TYPES.GetUserBookingsUseCase) private _getUserBookingsUseCase: IGetUserBookingsUseCase,
    @inject(TYPES.GetAllBookingsUseCase) private _getAllBookingsUseCase: IGetAllBookingsUseCase,
    @inject(TYPES.CompleteBookingUseCase) private _completeBookingUseCase: ICompleteBookingUseCase,
    @inject(TYPES.RescheduleBookingUseCase) private _rescheduleBookingUseCase: IRescheduleBookingUseCase,
    @inject(TYPES.CancelBookingUseCase) private _cancelBookingUseCase: ICancelBookingUseCase,
    @inject(TYPES.RefundBookingUseCase) private _refundBookingUseCase: IRefundBookingUseCase
  ) {}

  async getAllBookings(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this._getAllBookingsUseCase.execute(page, limit);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }



  async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as AuthenticatedUser)?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this._getUserBookingsUseCase.execute(userId, page, limit);
      res.status(StatusCode.SUCCESS).json(result);
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
        res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this._getCompanyBookingsUseCase.execute(companyId, page, limit);
      res.status(StatusCode.SUCCESS).json(result);
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
         res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
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
         res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
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

  async getCompanyConfig(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      if (!companyId) {
         res.status(StatusCode.BAD_REQUEST).json({ message: Messages.COMPANY.ID_REQUIRED });
         return;
      }
      const config = await this._getSlotConfigUseCase.execute(companyId as string);
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
         res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
         return;
      }
      await this._deleteSlotConfigUseCase.execute(companyId);
      res.status(StatusCode.SUCCESS).json({ message: Messages.SLOT.CONFIG_DELETE_SUCCESS });
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
        res.status(StatusCode.BAD_REQUEST).json({ message: Messages.SLOT.ID_DATE_REQUIRED });
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
         res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
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

  async completeBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = (req.user as AuthenticatedUser)?.id;
      if (!userId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
        return;
      }
      const result = await this._completeBookingUseCase.execute(bookingId as string, userId);
      res.status(StatusCode.SUCCESS).json(result);
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async rescheduleBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { newDate, newStartTime } = req.body;
      await this._rescheduleBookingUseCase.execute(bookingId as string, new Date(newDate), newStartTime);
      res.status(StatusCode.SUCCESS).json({ message: Messages.BOOKING.RESCHEDULE_SUCCESS });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const companyId = (req.user as AuthenticatedUser)?.id;
      if (!companyId) {
        res.status(StatusCode.UNAUTHORIZED).json({ message: Messages.GENERIC.UNAUTHORIZED });
        return;
      }
      await this._cancelBookingUseCase.execute(companyId, bookingId as string);
      res.status(StatusCode.SUCCESS).json({ message: "Booking cancelled successfully" });
    } catch (error: unknown) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        const message = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(StatusCode.INTERNAL_ERROR).json({ message });
      }
    }
  }

  async refundBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      await this._refundBookingUseCase.execute(bookingId as string);
      res.status(StatusCode.SUCCESS).json({ message: "Refund processed successfully" });
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
