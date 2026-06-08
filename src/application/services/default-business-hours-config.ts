import { env } from "../../config/env.js";
import type { BusinessHoursConfig } from "./business-hours-service.js";

export const defaultBusinessHoursConfig: BusinessHoursConfig = {
  timezone: env.BUSINESS_HOURS_TIMEZONE,

  morningStart: env.BUSINESS_START_MORNING,
  morningEnd: env.BUSINESS_END_MORNING,

  afternoonStart: env.BUSINESS_START_AFTERNOON,
  afternoonEnd: env.BUSINESS_END_AFTERNOON,
};
