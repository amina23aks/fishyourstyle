export const DEFAULT_TIME_ZONE = "Africa/Algiers";

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
  };
}

export function dateKeyInTZ(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const { year, month, day } = getDateParts(date, timeZone);
  const paddedMonth = String(month).padStart(2, "0");
  const paddedDay = String(day).padStart(2, "0");
  return `${year}-${paddedMonth}-${paddedDay}`;
}

export function weekKeyInTZ(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): string {
  const { year, month, day } = getDateParts(date, timeZone);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = anchor.getUTCDay() || 7;
  anchor.setUTCDate(anchor.getUTCDate() + 4 - dayOfWeek);
  const yearStart = new Date(Date.UTC(anchor.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((anchor.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${anchor.getUTCFullYear()}-${String(weekNumber).padStart(2, "0")}`;
}
