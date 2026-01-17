import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionDocument extends Document {
  bookingId?: mongoose.Types.ObjectId;
  type: "booking_payment" | "company_payout" | "subscription";
  amount: number;
  status: "pending" | "completed" | "failed";
  fromUser?: mongoose.Types.ObjectId;
  toCompany?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    type: { 
      type: String, 
      enum: ["booking_payment", "company_payout", "subscription"], 
      required: true 
    },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "completed" 
    },
    fromUser: { type: Schema.Types.ObjectId, ref: "User" },
    toCompany: { type: Schema.Types.ObjectId, ref: "Company" },
  },
  { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);
export default TransactionModel;
