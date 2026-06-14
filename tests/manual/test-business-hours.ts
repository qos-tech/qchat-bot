import { defaultBusinessHoursConfig } from "../../src/application/services/default-business-hours-config.js";
import { DefaultBusinessHoursService } from "../../src/infrastructure/services/default-business-hours-service.js";

const service = new DefaultBusinessHoursService();

const scenarios = [
  {
    name: "Segunda 09:00",
    date: new Date("2026-06-08T09:00:00-03:00"),
  },

  {
    name: "Segunda 12:30",
    date: new Date("2026-06-08T12:30:00-03:00"),
  },

  {
    name: "Segunda 18:00",
    date: new Date("2026-06-08T18:00:00-03:00"),
  },

  {
    name: "Sábado 10:00",
    date: new Date("2026-06-06T10:00:00-03:00"),
  },

  {
    name: "Domingo 10:00",
    date: new Date("2026-06-07T10:00:00-03:00"),
  },

  {
    name: "Natal 10:00",
    date: new Date("2026-12-25T10:00:00-03:00"),
  },
  {
    name: "Segunda 08:29",
    date: new Date("2026-06-08T08:29:00-03:00"),
  },
  {
    name: "Segunda 13:00",
    date: new Date("2026-06-08T13:00:00-03:00"),
  },
  {
    name: "Segunda 17:30",
    date: new Date("2026-06-08T17:30:00-03:00"),
  },
];

for (const scenario of scenarios) {
  const result = await service.check(defaultBusinessHoursConfig, scenario.date);

  console.log("\n========================");
  console.log(scenario.name);
  console.log("========================");
  console.log(result);
}

const originalOverride = process.env.BUSINESS_HOURS_OVERRIDE;

try {
  process.env.BUSINESS_HOURS_OVERRIDE = "open";

  const forcedOpen = await service.check(
    defaultBusinessHoursConfig,
    new Date("2026-06-07T10:00:00-03:00"),
  );

  if (!forcedOpen.isOpen || forcedOpen.reason !== "business_hours") {
    throw new Error("Override open deveria forcar business_hours");
  }

  console.log("\n========================");
  console.log("Override open");
  console.log("========================");
  console.log(forcedOpen);

  process.env.BUSINESS_HOURS_OVERRIDE = "closed";

  const forcedClosed = await service.check(
    defaultBusinessHoursConfig,
    new Date("2026-06-08T09:00:00-03:00"),
  );

  if (forcedClosed.isOpen || forcedClosed.reason !== "after_closing") {
    throw new Error("Override closed deveria forcar after_closing");
  }

  console.log("\n========================");
  console.log("Override closed");
  console.log("========================");
  console.log(forcedClosed);
} finally {
  if (originalOverride === undefined) {
    delete process.env.BUSINESS_HOURS_OVERRIDE;
  } else {
    process.env.BUSINESS_HOURS_OVERRIDE = originalOverride;
  }
}

process.exit(0);
