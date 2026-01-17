export interface ITransaction {
  id?: string;
  bookingId?: string;
  type: "booking_payment" | "company_payout" | "subscription";
  amount: number;
  status: "pending" | "completed" | "failed";
  fromUser?: string;
  toCompany?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
