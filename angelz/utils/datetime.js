const APP_TIMEZONE = process.env.APP_TIMEZONE || process.env.TIMEZONE || '+05:00';

function parseTimezoneOffsetMs(tzStr) {
  if (!tzStr) return 5 * 3600 * 1000;
  const match = String(tzStr).trim().match(/^([+-])(\d{2}):?(\d{2})?$/);
  if (!match) return 5 * 3600 * 1000;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10) || 0;
  const mins = parseInt(match[3], 10) || 0;
  return sign * (hours * 3600 + mins * 60) * 1000;
}

/**
 * Accurately parses a datetime value into a Date object representing the exact point in time.
 * If the input lacks timezone info, it explicitly associates it with APP_TIMEZONE (+05:00).
 */
function parseLocalDateTime(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // If it has explicit timezone indicator at the end (e.g. "Z", "+05:00", "-04:00")
    if (/[Z+-]\d{2}(?::?\d{2})?$/i.test(trimmed.slice(10))) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }

    // No timezone indicator: string represents local time components (YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss)
    const [datePart, timePartRaw] = trimmed.split(/[T\s]/);
    if (!datePart) return null;
    let timePart = timePartRaw || "00:00:00";
    if (timePart.length === 5) timePart += ":00"; // convert HH:mm to HH:mm:ss
    const isoWithTz = `${datePart}T${timePart}${APP_TIMEZONE}`;
    const d = new Date(isoWithTz);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a Date or date string into standard ISO local representation: "YYYY-MM-DDTHH:mm:ss"
 * aligned with the application timezone (APP_TIMEZONE, e.g. +05:00).
 */
function toLocalISOString(date) {
  if (!date) return null;
  const d = parseLocalDateTime(date);
  if (!d || isNaN(d.getTime())) return null;

  // Shift UTC time by APP_TIMEZONE offset to extract exact wall-clock components
  const offsetMs = parseTimezoneOffsetMs(APP_TIMEZONE);
  const targetTime = new Date(d.getTime() + offsetMs);

  const pad = (n) => String(n).padStart(2, '0');
  const year = targetTime.getUTCFullYear();
  const month = pad(targetTime.getUTCMonth() + 1);
  const day = pad(targetTime.getUTCDate());
  const hours = pad(targetTime.getUTCHours());
  const minutes = pad(targetTime.getUTCMinutes());
  const seconds = pad(targetTime.getUTCSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Returns true ONLY if the given start time is strictly in the future compared to the current time.
 * Returns false if start time is in the past, equal to now, or invalid/empty.
 */
function isFutureTime(timeVal) {
  const startDate = parseLocalDateTime(timeVal);
  if (!startDate) return false;
  return startDate.getTime() > Date.now();
}

module.exports = { APP_TIMEZONE, toLocalISOString, parseLocalDateTime, isFutureTime };

