export interface IBooking {
  id?: string;
  companyId: string;
  userId: string;
  date: Date;
  startTime: string; // e.g., "10:00"
  endTime: string;   // e.g., "11:00"
  status: "pending" | "confirmed" | "cancelled";
  price?: number;
  adminCommission?: number;
  paymentStatus?: "pending" | "paid" | "failed";
  serviceStatus?: "pending" | "completed";
  payoutStatus?: "pending" | "completed";
  stripeSessionId?: string;
  userDetails?: {
    name: string;
    email: string;
    profileImage?: string;
  };
  companyDetails?: {
    name: string;
    logo?: string;
  };
  isRescheduled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
