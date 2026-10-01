function toLocalISOString(date) {
  if (!date) return null;
  const d = new Date(date);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 19);
}

/**
 * Accurately parses a datetime value into a Date object in the local timezone,
 * regardless of whether it's a Date object, MySQL "YYYY-MM-DD HH:mm:ss" string,
 * or ISO "YYYY-MM-DDTHH:mm:ss" string produced by toLocalISOString.
 */
function parseLocalDateTime(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    // If it has explicit timezone indicator at the end (e.g. "Z", "+05:00", "-04:00")
    if (/[Z+-]\d{2}(?::?\d{2})?$/i.test(trimmed.slice(10))) {
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? null : d;
    }
    // No timezone indicator: string represents local time components (YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss)
    const [datePart, timePart] = trimmed.split(/[T\s]/);
    if (!datePart) return null;
    const [y, m, d] = datePart.split('-').map(Number);
    if (!y || !m || !d) return null;
    let hr = 0, min = 0, sec = 0;
    if (timePart) {
      const [hStr, mStr, sStr] = timePart.split(':');
      hr = parseInt(hStr, 10) || 0;
      min = parseInt(mStr, 10) || 0;
      sec = parseInt(sStr, 10) || 0;
    }
    return new Date(y, m - 1, d, hr, min, sec);
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
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

module.exports = { toLocalISOString, parseLocalDateTime, isFutureTime };

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

