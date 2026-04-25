export interface ISlotConfig {
  id?: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  startTime: string; // e.g., "09:00"
  endTime: string;   // e.g., "17:00"
  slotDuration: number; // in minutes
  bufferTime: number;   // in minutes
  weekdays: string[];   // e.g., ["Monday", "Tuesday"]
  exceptionalDays: Date[]; // Optional: dates (on available weekdays) where slots are closed
  createdAt?: Date;
  updatedAt?: Date;
}
