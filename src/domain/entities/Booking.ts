export interface IBooking {
  id?: string;
  companyId: string;
  userId: string;
  date: Date;
  startTime: string; // e.g., "10:00"
  endTime: string;   // e.g., "11:00"
  status: "pending" | "confirmed" | "cancelled";
  userDetails?: {
    name: string;
    email: string;
    profileImage?: string;
  };
  companyDetails?: {
    name: string;
    logo?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
