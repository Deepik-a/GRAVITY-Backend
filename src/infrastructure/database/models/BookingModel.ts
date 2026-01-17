import mongoose, { Schema, Document } from "mongoose";

export interface IBookingDocument extends Document {
  companyId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "cancelled";
  price: number;
  adminCommission: number;
  paymentStatus: "pending" | "paid" | "failed";
  payoutStatus: "pending" | "completed";
  stripeSessionId?: string;
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
      enum: ["pending", "paid", "failed"],
      default: "pending",
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
  },
  { timestamps: true }
);

BookingSchema.index({ companyId: 1, date: 1, startTime: 1 }, { unique: true });

const BookingModel = mongoose.model<IBookingDocument>("Booking", BookingSchema);
export default BookingModel;
