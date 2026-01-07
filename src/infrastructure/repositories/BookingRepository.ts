import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import BookingModel, { IBookingDocument } from "@/infrastructure/database/models/BookingModel";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";

import { injectable } from "inversify";

@injectable()
export class BookingRepository
  extends BaseRepository<IBookingDocument>
  implements IBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  async createBooking(booking: IBooking): Promise<IBooking> {
    const created = await this.model.create(booking);
    return this._mapToEntity(created.toObject());
  }

  async getBookingsByCompanyAndDate(companyId: string, date: Date): Promise<IBooking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await this.model.find({
      companyId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    }).lean();

    return bookings.map(b => this._mapToEntity(b));
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    const bookings = await this.model.find({ userId }).populate("companyId").lean();
    return bookings.map(b => this._mapToEntity(b));
  }

  async getCompanyBookings(companyId: string): Promise<IBooking[]> {
    const bookings = await this.model.find({ companyId })
      .populate("userId")
      .sort({ date: 1, startTime: 1 })
      .lean();
    return bookings.map(b => this._mapToEntity(b));
  }

  async cancelBooking(bookingId: string): Promise<boolean> {
    const result = await this.model.updateOne(
      { _id: bookingId },
      { $set: { status: "cancelled" } }
    );
    return result.modifiedCount > 0;
  }

  private _mapToEntity(doc: unknown): IBooking {
    const d = doc as {
      _id: { toString(): string };
      companyId: string | { _id: { toString(): string }; name?: string; logo?: string };
      userId: string | { _id: { toString(): string }; name?: string; email?: string; profileImage?: string };
      date: Date;
      startTime: string;
      endTime: string;
      status: "pending" | "confirmed" | "cancelled";
      createdAt: Date;
      updatedAt: Date;
    };
    const booking: IBooking = {
      id: d._id.toString(),
      companyId: typeof d.companyId === "object" && d.companyId?._id ? d.companyId._id.toString() : d.companyId.toString(),
      userId: typeof d.userId === "object" && d.userId?._id ? d.userId._id.toString() : d.userId.toString(),
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };

    if (typeof d.userId === "object" && d.userId !== null && "name" in d.userId) {
      booking.userDetails = {
        name: d.userId.name || "",
        email: d.userId.email || "",
        profileImage: d.userId.profileImage, // Optional in IBooking
      };
    }

    if (typeof d.companyId === "object" && d.companyId !== null && "name" in d.companyId) {
      booking.companyDetails = {
        name: d.companyId.name || "",
        logo: d.companyId.logo, // Optional in IBooking
      };
    }

    return booking;
  }
}
