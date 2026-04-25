import BookingModel from "@/infrastructure/database/models/BookingModel";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { IBooking } from "@/domain/entities/Booking";
import { FilterQuery, Types, PipelineStage } from "mongoose";
import { injectable } from "inversify";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

interface BookingDocument {
  _id: { toString: () => string };
  id?: string;
  companyId: { _id: { toString: () => string } } | { toString: () => string };
  userId: { _id: { toString: () => string } } | { toString: () => string };
  date: Date;
  startTime: string;
  endTime: string;
  status?: "pending" | "confirmed" | "cancelled";
  price?: number;
  adminCommission?: number;
  paymentStatus?: PaymentStatus;
  serviceStatus?: "pending" | "completed";
  payoutStatus?: "pending" | "completed";
  stripeSessionId?: string;
  isRescheduled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  userDetails?: { name: string; email: string; profileImage?: string };
  companyDetails?: { name: string; logo?: string };
}

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
    return this._mapToEntity(created.toObject() as unknown as Record<string, unknown>);
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
        .sort({ date: -1, startTime: -1 })
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

  async getAllBookingsPaged(page: number, limit: number, search = ""): Promise<{ bookings: IBooking[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Aggregation Pipeline for global search and join
    const pipeline: PipelineStage[] = [
      // 1. Initial lookup for user
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      
      // 2. Initial lookup for company
      {
        $lookup: {
          from: "companies",
          localField: "companyId",
          foreignField: "_id",
          as: "companyDetails"
        }
      },
      { $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true } },
      
      // 3. Search Filter
      ...(search ? [{
        $match: {
          $or: [
            { _id: Types.ObjectId.isValid(search) ? new Types.ObjectId(search) : { $exists: true, $eq: null } },
            { "userDetails.name": { $regex: search, $options: "i" } },
            { "userDetails.email": { $regex: search, $options: "i" } },
            { "companyDetails.name": { $regex: search, $options: "i" } },
            { status: { $regex: search, $options: "i" } },
            { paymentStatus: { $regex: search, $options: "i" } }
          ]
        }
      }] : []),

      // 4. Sort and Pagination
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    ];

    const result = await this.model.aggregate(pipeline);
    const bookings = result[0].data || [];
    const total = result[0].metadata[0]?.total || 0;

    return {
      bookings: bookings.map((b: Record<string, unknown>) => this._mapToEntity(b)),
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

  private _mapToEntity(doc: Record<string, unknown>): IBooking {
    const d = doc as unknown as BookingDocument;
    const booking: IBooking = {
      id: d._id ? d._id.toString() : d.id,
      companyId: d.companyId ? ("_id" in d.companyId ? d.companyId._id.toString() : d.companyId.toString()) : "",
      userId: d.userId ? ("_id" in d.userId ? d.userId._id.toString() : d.userId.toString()) : "",
      date: d.date,
      startTime: d.startTime,
      endTime: d.endTime,
      status: (d.status || "pending") as "pending" | "confirmed" | "cancelled",
      price: d.price,
      adminCommission: d.adminCommission,
      paymentStatus: (d.paymentStatus || PaymentStatus.PENDING) as PaymentStatus,
      serviceStatus: (d.serviceStatus || "pending") as "pending" | "completed",
      payoutStatus: (d.payoutStatus || "pending") as "pending" | "completed",
      stripeSessionId: d.stripeSessionId,
      isRescheduled: d.isRescheduled || false,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };

    // Priority 1: Direct userDetails (from aggregation)
    if (d.userDetails && typeof d.userDetails === "object") {
        booking.userDetails = {
            name: (d.userDetails as { name?: string }).name || "",
            email: (d.userDetails as { email?: string }).email || "",
            profileImage: (d.userDetails as { profileImage?: string }).profileImage,
        };
    } 
    // Priority 2: Populated userId (from .populate())
    else if (!booking.userDetails && d.userId && typeof d.userId === "object") {
      booking.userDetails = {
        name: (d.userId as { name?: string }).name || "",
        email: (d.userId as { email?: string }).email || "",
        profileImage: (d.userId as { profileImage?: string }).profileImage,
      };
    }

    // Priority 1: Direct companyDetails (from aggregation)
    if (d.companyDetails && typeof d.companyDetails === "object") {
        booking.companyDetails = {
            name: (d.companyDetails as { name?: string }).name || "",
            logo: (d.companyDetails as { logo?: string }).logo,
        };
    }
    // Priority 2: Populated companyId (from .populate())
    else if (typeof d.companyId === "object" && d.companyId !== null && "name" in d.companyId) {
      booking.companyDetails = {
        name: (d.companyId as { name?: string }).name || "",
        logo: (d.companyId as { logo?: string }).logo,
      };
    }

    return booking;
  }
}

