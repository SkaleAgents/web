export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function zonedParts(timestamp: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(timestamp);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function localDateTimeToIso(value: string, timeZone: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) || !isValidTimeZone(timeZone)) return null;
  const wallTime = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(wallTime)) return null;

  let timestamp = wallTime;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const rendered = zonedParts(timestamp, timeZone);
    const renderedAsUtc = Date.parse(`${rendered}:00Z`);
    timestamp += wallTime - renderedAsUtc;
  }

  if (zonedParts(timestamp, timeZone) !== value) return null;
  for (let minutes = -180; minutes <= 180; minutes += 15) {
    if (minutes !== 0 && zonedParts(timestamp + minutes * 60_000, timeZone) === value) return null;
  }
  const offsetMinutes = (wallTime - timestamp) / 60_000;
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, "0")}:${String(absoluteOffset % 60).padStart(2, "0")}`;
  return `${value}:00${offset}`;
}

export function isoToLocalDateTime(value: string, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) return "";
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? zonedParts(timestamp, timeZone) : "";
}
