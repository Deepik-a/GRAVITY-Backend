import mongoose, { Schema, Document } from "mongoose";

export interface ITransactionDocument extends Document {
  type: "booking_payment" | "subscription_payment" | "admin_commission" | "company_payout";
  amount: number;
  status: "pending" | "completed" | "failed" | "pending_transfer";
  
  // References
  bookingId?: mongoose.Types.ObjectId;
  subscriptionPlanId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  companyId?: mongoose.Types.ObjectId;
  
  // Details
  description: string;
  commissionRate?: number;
  commissionAmount?: number;
  netAmount?: number;
  
  // Stripe details
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    type: { 
      type: String, 
      enum: ["booking_payment", "subscription_payment", "admin_commission", "company_payout"], 
      required: true 
    },
    amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed", "pending_transfer"], 
      default: "completed" 
    },
    
    // References
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    subscriptionPlanId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    companyId: { type: Schema.Types.ObjectId, ref: "Company" },
    
    // Details
    description: { type: String, required: true },
    commissionRate: { type: Number },
    commissionAmount: { type: Number },
    netAmount: { type: Number },
    
    // Stripe details
    stripeSessionId: { type: String },
    stripePaymentIntentId: { type: String },
  },
  { timestamps: true }
);

// Indexes for efficient querying
TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ userId: 1 });
TransactionSchema.index({ companyId: 1 });
TransactionSchema.index({ createdAt: -1 });

export const TransactionModel = mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);
export default TransactionModel;

