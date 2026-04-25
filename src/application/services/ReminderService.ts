import { injectable, inject } from "inversify";
import { TYPES } from "@/infrastructure/DI/types";
import { IBookingRepository } from "@/domain/repositories/IBookingRepository";
import { NotificationService } from "@/application/services/NotificationService";

@injectable()
export class ReminderService {
  constructor(
    @inject(TYPES.BookingRepository) private _bookingRepository: IBookingRepository,
    @inject(TYPES.NotificationService) private _notificationService: NotificationService
  ) {}

  async sendBookingReminders() {
    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    try {
      const upcomingBookings = await this._bookingRepository.getBookingsInDateRange(
        tomorrowStart, 
        tomorrowEnd, 
        "confirmed"
      );

      for (const booking of upcomingBookings) {
        // Notify User
        await this._notificationService.createNotification({
          recipientId: booking.userId,
          recipientType: "user",
          title: "Booking Reminder",
          message: `You have a booking tomorrow at ${booking.startTime}.`,
          type: "BOOKING_REMINDER"
        });

        // Notify Company
        await this._notificationService.createNotification({
          recipientId: booking.companyId,
          recipientType: "company",
          title: "Upcoming Consultation",
          message: `You have a consultation tomorrow at ${booking.startTime}.`,
          type: "BOOKING_REMINDER"
        });
      }
    } catch {
      // Error handled silently
    }
  }

  startReminderTask() {
    // Run every hour
    setInterval(() => {
      this.sendBookingReminders().catch(void 0);
    }, 60 * 60 * 1000);
  }
}
