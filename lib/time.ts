/**
 * "Warm time" — ambient authorship is the romance (PRD §1). Rather than a cold
 * timestamp, render a soft, human phrase: "just now", "this morning",
 * "rainy Tuesday" (weekday for the last week), then a month + day for older.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function partOfDay(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "late last night";
  if (h < 12) return "this morning";
  if (h < 17) return "this afternoon";
  if (h < 21) return "this evening";
  return "tonight";
}

export function warmTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const ms = now.getTime() - then.getTime();
  const mins = Math.floor(ms / 60000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;

  const sameDay = then.toDateString() === now.toDateString();
  if (sameDay) return partOfDay(then);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (then.toDateString() === yesterday.toDateString()) return "yesterday";

  const days = Math.floor(ms / 86400000);
  if (days < 7) return WEEKDAYS[then.getDay()];

  if (then.getFullYear() === now.getFullYear()) {
    return `${MONTHS[then.getMonth()]} ${then.getDate()}`;
  }
  return `${MONTHS[then.getMonth()]} ${then.getFullYear()}`;
}
