export type BusinessHoursReason =
  | "business_hours"
  | "before_opening"
  | "lunch_break"
  | "after_closing"
  | "weekend"
  | "holiday";

export type BusinessHoursConfig = {
  timezone: string;

  morningStart: string;
  morningEnd: string;

  afternoonStart: string;
  afternoonEnd: string;
};

export type BusinessHoursResult = {
  isOpen: boolean;
  reason: BusinessHoursReason;
};

export interface BusinessHoursService {
  check(config: BusinessHoursConfig, date?: Date): Promise<BusinessHoursResult>;
}
