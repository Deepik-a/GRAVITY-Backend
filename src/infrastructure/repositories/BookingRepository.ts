import BookingModel from "@/infrastructure/database/models/BookingModel";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { FilterQuery, Types } from "mongoose";
import { injectable } from "inversify";

@injectable()
export class BookingRepository implements IBookingRepository {
  private readonly model = BookingModel;

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

  async getBookingsByCompanyAndDate(companyId: string, date: Date, statuses?: string[]): Promise<IBooking[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query: FilterQuery<IBooking> = {
      companyId: new Types.ObjectId(companyId),
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

  async getUserBookingsPaged(userId: string, page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.model.find({ userId })
        .populate("companyId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ userId })
    ]);
    return {
      bookings: bookings.map(b => this._mapToEntity(b)),
      total
    };
  }

  async getCompanyBookingsPaged(companyId: string, page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.model.find({ companyId })
        .populate("userId")
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments({ companyId })
    ]);
    return {
      bookings: bookings.map(b => this._mapToEntity(b)),
      total
    };
  }

  async checkSlotAvailability(companyId: string, date: Date, startTime: string): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingConfirmed = await this.model.findOne({
      companyId,
      startTime,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed"
    }).lean();

    return !existingConfirmed;
  }

  async getAllBookingsPaged(page: number, limit: number): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.model.find()
        .populate("userId")
        .populate("companyId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments()
    ]);
    return {
      bookings: bookings.map(b => this._mapToEntity(b)),
      total
    };
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
    const stats = await this.model.aggregate<{
      total: { count: number }[];
      completed: { count: number }[];
      breakdown: { status: string; count: number }[];
    }>([
      { $match: { companyId: new Types.ObjectId(companyId) } },
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

    const result = stats[0] || { total: [], completed: [], breakdown: [] };
    return {
      totalConsultations: result.total[0]?.count || 0,
      completedProjects: result.completed[0]?.count || 0,
      statusBreakdown: result.breakdown || []
    };
  }

  async getAllBookings(): Promise<IBooking[]> {
    const bookings = await this.model.find()
      .populate("userId")
      .populate("companyId")
      .sort({ createdAt: -1 })
      .lean();
    return bookings.map(b => this._mapToEntity(b));
  }

  async getCompanyBookings(companyId: string): Promise<IBooking[]> {
    const bookings = await this.model.find({ companyId })
      .populate("userId")
      .sort({ createdAt: -1 })
      .lean();
    return bookings.map(b => this._mapToEntity(b));
  }
  
  async findOneBooking(companyId: string, date: Date, startTime: string): Promise<IBooking | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const found = await this.model.findOne({
      companyId: new Types.ObjectId(companyId),
      startTime,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" }
    }).lean();

    return found ? this._mapToEntity(found) : null;
  }

  async getBookingsInDateRange(startDate: Date, endDate: Date, status?: string): Promise<IBooking[]> {
    const query: FilterQuery<IBooking> = {
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
        _id: Types.ObjectId;
        companyId: Types.ObjectId | { _id: Types.ObjectId; name?: string; logo?: string };
        userId: Types.ObjectId | { _id: Types.ObjectId; name?: string; email?: string; profileImage?: string };
        date: Date;
        startTime: string;
        endTime: string;
        status: "pending" | "confirmed" | "cancelled";
        price: number;
        adminCommission: number;
        paymentStatus?: "pending" | "paid" | "failed";
        serviceStatus?: "pending" | "completed";
        payoutStatus?: "pending" | "completed";
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
      status: d.status as "pending" | "confirmed" | "cancelled",
      price: d.price,
      adminCommission: d.adminCommission,
      paymentStatus: (d.paymentStatus || "pending") as "pending" | "paid" | "failed",
      serviceStatus: (d.serviceStatus || "pending") as "pending" | "completed",
      payoutStatus: (d.payoutStatus || "pending") as "pending" | "completed",
      stripeSessionId: d.stripeSessionId,
      isRescheduled: d.isRescheduled || false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };

    if (typeof d.userId === "object" && d.userId !== null && "name" in d.userId) {
      booking.userDetails = {
        name: d.userId.name || "",
        email: d.userId.email || "",
        profileImage: d.userId.profileImage,
      };
    }

    if (typeof d.companyId === "object" && d.companyId !== null && "name" in d.companyId) {
      booking.companyDetails = {
        name: d.companyId.name || "",
        logo: d.companyId.logo,
      };
    }

    return booking;
  }
}
