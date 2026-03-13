import { ITransaction } from "@/domain/entities/Transaction";

interface TransactionDocPOJO {
  _id?: { toString(): string };
  id?: { toString(): string };
  type: "booking_payment" | "subscription_payment" | "admin_commission" | "company_payout";
  amount: number;
  status: "pending" | "completed" | "failed" | "pending_transfer";
  bookingId?: { _id?: { toString(): string }, toString(): string };
  subscriptionPlanId?: { _id?: { toString(): string }, toString(): string };
  userId?: { _id?: { toString(): string }, toString(): string, name?: string, email?: string };
  companyId?: { _id?: { toString(): string }, toString(): string, name?: string, email?: string };
  description: string;
  commissionRate?: number;
  commissionAmount?: number;
  netAmount?: number;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TransactionMapper = {
  toEntity(doc: unknown): ITransaction {
    const d = doc as TransactionDocPOJO;
    return {
      id: d._id?.toString() || d.id?.toString() || "",
      type: d.type,
      amount: d.amount,
      status: d.status,
      bookingId: d.bookingId?._id?.toString() || d.bookingId?.toString(),
      subscriptionPlanId: d.subscriptionPlanId?._id?.toString() || d.subscriptionPlanId?.toString(),
      userId: d.userId?._id?.toString() || d.userId?.toString(),
      companyId: d.companyId?._id?.toString() || d.companyId?.toString(),
      description: d.description,
      commissionRate: d.commissionRate,
      commissionAmount: d.commissionAmount,
      netAmount: d.netAmount,
      stripeSessionId: d.stripeSessionId,
      stripePaymentIntentId: d.stripePaymentIntentId,
      userDetails: d.userId?.name ? {
        name: d.userId.name,
        email: d.userId.email || ""
      } : undefined,
      companyDetails: d.companyId?.name ? {
        name: d.companyId.name,
        email: d.companyId.email || ""
      } : undefined,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
};
