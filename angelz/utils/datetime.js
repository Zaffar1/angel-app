const APP_TIMEZONE = process.env.APP_TIMEZONE || '+05:00';
const APP_TIMEZONE_OFFSET_MS = 5 * 3600 * 1000; // +05:00 in milliseconds

const pad = (n) => String(n).padStart(2, '0');

/**
 * Returns the current local time in Pakistan (APP_TIMEZONE, +05:00)
 * formatted as "YYYY-MM-DD HH:mm:ss" for accurate SQL comparisons.
 */
function getCurrentLocalTimeString() {
  const localDate = new Date(Date.now() + APP_TIMEZONE_OFFSET_MS);
  const y = localDate.getUTCFullYear();
  const m = pad(localDate.getUTCMonth() + 1);
  const day = pad(localDate.getUTCDate());
  const hr = pad(localDate.getUTCHours());
  const min = pad(localDate.getUTCMinutes());
  const sec = pad(localDate.getUTCSeconds());
  return `${y}-${m}-${day} ${hr}:${min}:${sec}`;
}

/**
 * Accurately parses any datetime value (Date object, MySQL string, or ISO string)
 * into a Date object representing the exact moment in time, bound to Pakistan timezone (+05:00).
 */
function parseLocalDateTime(val) {
  if (!val) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val;
  }

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // If it already has an explicit timezone offset at the end (e.g. "+05:00", "-04:00")
    if (/[+-]\d{2}(?::?\d{2})?$/.test(trimmed)) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }

    // If it ends with "Z" (UTC)
    if (trimmed.endsWith('Z') || trimmed.endsWith('z')) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }

    // No timezone indicator: string is in local Pakistan time (YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss)
    const [datePart, timePartRaw] = trimmed.split(/[T\s]/);
    if (!datePart) return null;
    let timePart = timePartRaw || "00:00:00";
    if (timePart.length === 5) timePart += ":00"; // convert HH:mm to HH:mm:ss

    const [yStr, mStr, dStr] = datePart.split('-');
    const [hStr, minStr, sStr] = timePart.split(':');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const d = parseInt(dStr, 10);
    const hr = parseInt(hStr, 10) || 0;
    const min = parseInt(minStr, 10) || 0;
    const sec = parseInt(sStr, 10) || 0;

    if (!y || !m || !d) return null;

    // Compute exact UTC timestamp from local Pakistan components (UTC+5)
    const utcEpochMs = Date.UTC(y, m - 1, d, hr, min, sec) - APP_TIMEZONE_OFFSET_MS;
    return new Date(utcEpochMs);
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats any Date or datetime string into local ISO format: "YYYY-MM-DDTHH:mm:ss"
 * matching the user's local timezone (+05:00).
 */
function toLocalISOString(date) {
  if (!date) return null;
  const d = parseLocalDateTime(date);
  if (!d || isNaN(d.getTime())) return null;

  // Add APP_TIMEZONE offset to get UTC date representing local wall-clock time
  const localDate = new Date(d.getTime() + APP_TIMEZONE_OFFSET_MS);

  const y = localDate.getUTCFullYear();
  const m = pad(localDate.getUTCMonth() + 1);
  const day = pad(localDate.getUTCDate());
  const hr = pad(localDate.getUTCHours());
  const min = pad(localDate.getUTCMinutes());
  const sec = pad(localDate.getUTCSeconds());
  return `${y}-${m}-${day}T${hr}:${min}:${sec}`;
}

/**
 * Returns true ONLY if the given start time is strictly in the future compared to now.
 * Returns false if start time is in the past, equal to now, or invalid/empty.
 */
function isFutureTime(timeVal) {
  const startDate = parseLocalDateTime(timeVal);
  if (!startDate) return false;
  return startDate.getTime() > Date.now();
}

module.exports = { APP_TIMEZONE, toLocalISOString, parseLocalDateTime, isFutureTime, getCurrentLocalTimeString };

