import type { BusinessHoursConfig } from "./business-hours-service.js";

export const defaultBusinessHoursConfig: BusinessHoursConfig = {
  timezone: process.env.BUSINESS_HOURS_TIMEZONE ?? "America/Sao_Paulo",

  morningStart: process.env.BUSINESS_START_MORNING ?? "08:30",
  morningEnd: process.env.BUSINESS_END_MORNING ?? "12:00",

  afternoonStart: process.env.BUSINESS_START_AFTERNOON ?? "13:00",
  afternoonEnd: process.env.BUSINESS_END_AFTERNOON ?? "17:30",
};
