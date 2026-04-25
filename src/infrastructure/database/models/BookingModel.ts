import mongoose, { Schema, Document } from "mongoose";
import { PaymentStatus } from "@/domain/enums/PaymentStatus";

export interface IBookingDocument extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled";
  price: number;
  adminCommission: number;
  paymentStatus: PaymentStatus;
  serviceStatus: "pending" | "completed";
  payoutStatus: "pending" | "completed";
  stripeSessionId?: string;
  isRescheduled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDocument>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    adminCommission: { type: Number, required: true, default: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    stripeSessionId: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    payoutStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    serviceStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    isRescheduled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BookingSchema.index(
  { companyId: 1, date: 1, startTime: 1 }, 
  { 
    unique: true, 
    // This allows re-booking of already cancelled slots while still
    // enforcing only one confirmed or pending booking per slot.
    partialFilterExpression: { status: { $ne: "cancelled" } } 
  }
);

const BookingModel = mongoose.model<IBookingDocument>("Booking", BookingSchema);
export default BookingModel;
