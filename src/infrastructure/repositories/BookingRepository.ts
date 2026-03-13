import { BaseRepository } from "@/infrastructure/repositories/BaseRepository";
import BookingModel from "@/infrastructure/database/models/BookingModel";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import mongoose from "mongoose";

import { injectable } from "inversify";

@injectable()
export class BookingRepository
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extends BaseRepository<any>
  implements IBookingRepository
{
  constructor() {
    super(BookingModel);
  }

  async findById(id: string): Promise<IBooking | null> {
    const found = await this.model.findById(id).lean();
    return found ? this._mapToEntity(found) : null;
  }

  async updateById(id: string, updates: Partial<IBooking>): Promise<IBooking | null> {
    const updated = await this.model.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    return updated ? this._mapToEntity(updated) : null;
  }

  async createBooking(booking: IBooking): Promise<IBooking> {
    const created = await this.model.create(booking);
    return this._mapToEntity(created.toObject());
  }



  //fetches booking of a specific company on specific day
  async getBookingsByCompanyAndDate(companyId: string, date: Date, statuses?: string[]): Promise<IBooking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query: any = {
      companyId,
      date: { $gte: startOfDay, $lte: endOfDay },
    };

    if (statuses) {
      query.status = { $in: statuses };
    } else {
      query.status = { $ne: "cancelled" };
    }

    const bookings = await this.model.find(query).lean();
    return bookings.map(b => this._mapToEntity(b));
  }

//Find all bookings belonging to that user.
  async getUserBookings(userId: string): Promise<IBooking[]> {
    const bookings = await this.model.find({ userId }).populate("companyId").lean();
    return bookings.map(b => this._mapToEntity(b));
  }


  //Fetches all bookings of a company including user details
  async getCompanyBookings(companyId: string): Promise<IBooking[]> {
    const bookings = await this.model.find({ companyId })
      .populate("userId")
      .sort({ date: 1, startTime: 1 })
      .lean();
    return bookings.map(b => this._mapToEntity(b));
  }


  //same company,same starttime,same date,booking confirmed-If a record is found → slot is already booked.
  async checkSlotAvailability(companyId: string, date: Date, startTime: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if there is any "confirmed" booking for this slot
    const existingConfirmed = await this.model.findOne({
      companyId,
      startTime,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed"
    }).lean();

    return !existingConfirmed;
  }


  //Retrieves every booking document in the collection.No filters are applied.
  async getAllBookings(): Promise<IBooking[]> {
    const bookings = await this.model.find()
      .populate("userId")
      .populate("companyId")
      .sort({ createdAt: -1 })
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

  async getStats(companyId: string): Promise<{
    totalConsultations: number;
    completedProjects: number;
    statusBreakdown: { status: string; count: number }[];
  }> {
    const stats = await this.model.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
      {
        $facet: {
          total: [{ $count: "count" }],
          completed: [
            { $match: { serviceStatus: "completed" } },
            { $count: "count" }
          ],
          breakdown: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } }
          ]
        }
      }
    ]);

    const result = stats[0];
    return {
      totalConsultations: result.total[0]?.count || 0,
      completedProjects: result.completed[0]?.count || 0,
      statusBreakdown: result.breakdown || []
    };
  }
  
  async findOneBooking(companyId: string, date: Date, startTime: string): Promise<IBooking | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const found = await this.model.findOne({
      companyId,
      startTime,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" }
    }).lean();

    return found ? this._mapToEntity(found) : null;
  }

  async getBookingsInDateRange(startDate: Date, endDate: Date, status?: string): Promise<IBooking[]> {
    const query: any = {
      date: { $gte: startDate, $lte: endDate }
    };
    if (status) {
      query.status = status;
    }
    const bookings = await this.model.find(query).lean();
    return bookings.map(b => this._mapToEntity(b));
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
      price: number;
      adminCommission: number;
      paymentStatus: "pending" | "paid" | "failed";
      serviceStatus: "pending" | "completed";
      payoutStatus: "pending" | "completed";
      stripeSessionId?: string;
      isRescheduled?: boolean;
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
      price: d.price,
      adminCommission: d.adminCommission,
      paymentStatus: d.paymentStatus || "pending",
      serviceStatus: d.serviceStatus || "pending",
      payoutStatus: d.payoutStatus || "pending",
      stripeSessionId: d.stripeSessionId,
      isRescheduled: d.isRescheduled || false,
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
