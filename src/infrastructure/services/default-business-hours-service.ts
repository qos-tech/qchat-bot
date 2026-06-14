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
    const override = this.resolveOverride(process.env.BUSINESS_HOURS_OVERRIDE);

    if (override) {
      return override;
    }

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

  private resolveOverride(
    value: string | undefined,
  ): BusinessHoursResult | null {
    if (!value) {
      return null;
    }

    const normalized = value.trim().toLowerCase();

    if (
      normalized === "open" ||
      normalized === "true" ||
      normalized === "1" ||
      normalized === "business_hours"
    ) {
      return { isOpen: true, reason: "business_hours" };
    }

    if (
      normalized === "closed" ||
      normalized === "false" ||
      normalized === "0" ||
      normalized === "after_closing"
    ) {
      return { isOpen: false, reason: "after_closing" };
    }

    throw new Error(
      `BUSINESS_HOURS_OVERRIDE inválido: ${value}. Use open/closed`,
    );
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
