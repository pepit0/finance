/** Edmonton · Alberta business hours use Mountain Time. */
export const BOOKING_TIMEZONE = "America/Edmonton";

/** Minimum lead time before a slot can be booked. */
export const MIN_BOOKING_LEAD_MINUTES = 60;

const LUNCH_GAP = { start: 12 * 60, end: 13 * 60 };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function mountainDateParts(date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
  };
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function mountainTodayIso(): string {
  const { year, month, day } = mountainDateParts();
  return toIsoDate(year, month, day);
}

export function buildMountainIsoDate(year: number, month: number, day: number): string {
  return toIsoDate(year, month, day);
}

export function mountainMonthParts(date = new Date()): { year: number; month: number } {
  const { year, month } = mountainDateParts(date);
  return { year, month };
}

function mountainNowMinutes(): number {
  const { hour, minute } = mountainDateParts();
  return hour * 60 + minute;
}

export function mountainDayOfWeek(date: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BOOKING_TIMEZONE,
    weekday: "long",
  }).format(date);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days.indexOf(weekday);
}

export function dateToMountainIso(date: Date): string {
  const { year, month, day } = mountainDateParts(date);
  return toIsoDate(year, month, day);
}

export function isoToLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatSlot(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  let hours12 = hours24 % 12;
  if (hours12 === 0) {
    hours12 = 12;
  }
  return `${hours12}:${pad2(minutes)} ${period}`;
}

function buildSlots(
  startMinutes: number,
  endMinutes: number,
  interval = 30,
  lunchGap?: { start: number; end: number },
): string[] {
  const slots: string[] = [];
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += interval) {
    if (lunchGap && minutes >= lunchGap.start && minutes < lunchGap.end) {
      continue;
    }
    slots.push(formatSlot(minutes));
  }
  return slots;
}

/** Weekdays 9 AM–7:30 PM, Saturdays 9 AM–5 PM, Sundays 11 AM–4 PM (Mountain Time). */
export function getTimeSlotsForDate(date: Date): string[] {
  const day = mountainDayOfWeek(date);
  if (day === 0) {
    return buildSlots(11 * 60, 16 * 60);
  }
  if (day === 6) {
    return buildSlots(9 * 60, 17 * 60, 30, LUNCH_GAP);
  }
  return buildSlots(9 * 60, 19 * 60 + 30, 30, LUNCH_GAP);
}

export function getTimeSlotsForIso(iso: string): string[] {
  return getTimeSlotsForDate(isoToLocalDate(iso));
}

export function getBookingHoursLabel(date: Date): string {
  const day = mountainDayOfWeek(date);
  if (day === 0) {
    return "Sundays · 11 AM – 4 PM";
  }
  if (day === 6) {
    return "Saturdays · 9 AM – 5 PM";
  }
  return "Weekdays · 9 AM – 7:30 PM";
}

export function parseSlotMinutes(slot: string): number {
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return 0;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === "PM" && hours !== 12) {
    hours += 12;
  }
  if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/** True when the slot is outside business hours, in the past, or within the minimum lead time today. */
export function isSlotUnavailable(date: Date, slot: string): boolean {
  if (!getTimeSlotsForDate(date).includes(slot)) {
    return true;
  }

  const iso = dateToMountainIso(date);
  if (iso !== mountainTodayIso()) {
    return false;
  }

  const slotMinutes = parseSlotMinutes(slot);
  const earliestBookable = mountainNowMinutes() + MIN_BOOKING_LEAD_MINUTES;
  return slotMinutes <= earliestBookable;
}

export function isSlotUnavailableForIso(iso: string, slot: string): boolean {
  return isSlotUnavailable(isoToLocalDate(iso), slot);
}

export function firstAvailableSlot(date: Date): string | null {
  for (const slot of getTimeSlotsForDate(date)) {
    if (!isSlotUnavailable(date, slot)) {
      return slot;
    }
  }
  return null;
}

export function firstAvailableSlotForIso(iso: string): string | null {
  return firstAvailableSlot(isoToLocalDate(iso));
}

export function isMountainToday(date: Date): boolean {
  return dateToMountainIso(date) === mountainTodayIso();
}
