import Holidays from "date-holidays";
import { toZonedTime } from "date-fns-tz";
import type {
  BusinessHoursConfig,
  BusinessHoursResult,
  BusinessHoursService,
} from "../../application/services/business-hours-service.js";

export class DefaultBusinessHoursService implements BusinessHoursService {
  private readonly holidays = new Holidays("BR");

  async check(
    config: BusinessHoursConfig,
    date = new Date(),
  ): Promise<BusinessHoursResult> {
    const localDate = toZonedTime(date, config.timezone);

    if (this.isWeekend(localDate)) {
      return { isOpen: false, reason: "weekend" };
    }

    if (this.isHoliday(localDate)) {
      return { isOpen: false, reason: "holiday" };
    }

    const currentMinutes = this.toMinutes(
      `${localDate.getHours()}:${localDate.getMinutes()}`,
    );

    const morningStart = this.toMinutes(config.morningStart);
    const morningEnd = this.toMinutes(config.morningEnd);
    const afternoonStart = this.toMinutes(config.afternoonStart);
    const afternoonEnd = this.toMinutes(config.afternoonEnd);

    if (currentMinutes < morningStart) {
      return { isOpen: false, reason: "before_opening" };
    }

    if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
      return { isOpen: true, reason: "business_hours" };
    }

    if (currentMinutes >= morningEnd && currentMinutes < afternoonStart) {
      return { isOpen: false, reason: "lunch_break" };
    }

    if (currentMinutes >= afternoonStart && currentMinutes < afternoonEnd) {
      return { isOpen: true, reason: "business_hours" };
    }

    return { isOpen: false, reason: "after_closing" };
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();

    return day === 0 || day === 6;
  }

  private isHoliday(date: Date): boolean {
    return Boolean(this.holidays.isHoliday(date));
  }

  private toMinutes(time: string): number {
    const [hour = "0", minute = "0"] = time.split(":");

    return Number(hour) * 60 + Number(minute);
  }
}
