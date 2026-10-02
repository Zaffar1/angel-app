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
 * Converts any date representation (string or Date object) into MySQL "YYYY-MM-DD HH:mm:ss",
 * preserving the exact wall-clock year, month, day, hour, and minute selected by the user.
 * Never applies an unintended timezone shift.
 */
function formatForMySQL(val) {
  if (!val) return null;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Direct match for ISO or SQL datetime strings (e.g. "2026-10-02T17:59", "2026-10-02 17:59:00")
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)/);
    if (match) {
      let timePart = match[2];
      if (timePart.length === 5) timePart += ':00';
      return `${match[1]} ${timePart.slice(0, 8)}`;
    }
  }

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getUTCFullYear();
    const m = pad(val.getUTCMonth() + 1);
    const d = pad(val.getUTCDate());
    const hr = pad(val.getUTCHours());
    const min = pad(val.getUTCMinutes());
    const sec = pad(val.getUTCSeconds());
    return `${y}-${m}-${d} ${hr}:${min}:${sec}`;
  }

  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hr = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const sec = pad(d.getUTCSeconds());
  return `${y}-${m}-${day} ${hr}:${min}:${sec}`;
}

/**
 * Formats a database date value into "YYYY-MM-DDTHH:mm:ss" for APIs and UI inputs,
 * preserving the exact user-selected date and time without adding or subtracting any offset.
 */
function toLocalISOString(val) {
  if (!val) return null;
  const sqlStr = formatForMySQL(val);
  if (!sqlStr) return null;
  return sqlStr.replace(' ', 'T');
}

/**
 * Returns true ONLY if the given start time is strictly in the future compared to current local time.
 * Returns false if start time is in the past, equal to now, or invalid/empty.
 */
function isFutureTime(timeVal) {
  if (!timeVal) return false;
  const startStr = formatForMySQL(timeVal);
  if (!startStr) return false;
  const currentStr = getCurrentLocalTimeString();
  return startStr > currentStr;
}

module.exports = {
  APP_TIMEZONE,
  getCurrentLocalTimeString,
  formatForMySQL,
  toLocalISOString,
  isFutureTime
};

