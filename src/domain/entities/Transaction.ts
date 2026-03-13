export interface ITransaction {
  id?: string;
  type: "booking_payment" | "subscription_payment" | "admin_commission" | "company_payout";
  amount: number;
  status: "pending" | "completed" | "failed" | "pending_transfer";
  
  // References
  bookingId?: string;
  subscriptionPlanId?: string;
  userId?: string;
  companyId?: string;
  
  // Details
  description: string;
  commissionRate?: number; // 10% or 5% based on subscription status
  commissionAmount?: number;
  netAmount?: number; // Amount after commission
  
  // Stripe details
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  
  // Related entity details for display
  userDetails?: {
    name: string;
    email: string;
  };
  companyDetails?: {
    name: string;
    email: string;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}
