/**
 * Safely parses any date string, timestamp, or Date object into a valid Date in the user's local timezone.
 * Handles MySQL DATETIME ("YYYY-MM-DD HH:mm:ss"), ISO strings with/without Z, and Unix timestamps.
 * Server timestamps stored in UTC without timezone offsets are normalized so the browser correctly converts to local timezone.
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;

  let str = String(dateStr).trim();
  if (!str) return null;

  // Numeric timestamp (e.g. 1728218153000 or 1728218153)
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    const d = new Date(str.length === 10 ? num * 1000 : num);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle MySQL format "YYYY-MM-DD HH:mm:ss" -> replace space with 'T' and treat as UTC
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(str)) {
    str = str.replace(" ", "T") + "Z";
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Explicit UTC with 'Z' or timezone offset
  if (str.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
  }

  // Datetime with seconds/subseconds from API without Z -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    const d = new Date(str + "Z");
    if (!isNaN(d.getTime())) return d;
  }

  // Local datetime "YYYY-MM-DDTHH:mm" (no seconds, from local picker)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    const [dPart, tPart] = str.split("T");
    const [y, m, d] = dPart.split("-").map(Number);
    const [h, min] = tPart.split(":").map(Number);
    return new Date(y, m - 1, d, h, min);
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Convert "HH:mm" (24h) string → "h:mm AM/PM"
 * Example: "13:45" → "1:45 PM"
 */
export function formatTime(value) {
  if (!value) return "";

  const str = String(value).trim();
  // If it's a full date or datetime string
  if (str.includes("T") || str.includes("-") || str.includes("/") || str.includes(" ")) {
    const date = parseDate(str);
    if (date && !isNaN(date.getTime())) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  // If it's a simple "HH:mm" or "HH:mm:ss"
  if (/^\d{1,2}:\d{2}/.test(str)) {
    const [h, m] = str.split(":");
    const hour = parseInt(h, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const adjusted = hour % 12 || 12;
    return `${adjusted}:${m} ${suffix}`;
  }

  return str;
}


/**
 * Convert "h:mm AM/PM" → "HH:mm" (24h)
 * Example: "1:45 PM" → "13:45"
 */
export function parseTime(value) {
  if (!value) return "";
  const [time, suffix] = value.split(" ");
  const [h, m] = time.split(":");
  let hour = parseInt(h, 10);

  if (suffix?.toUpperCase() === "PM" && hour < 12) hour += 12;
  if (suffix?.toUpperCase() === "AM" && hour === 12) hour = 0;

  return `${hour.toString().padStart(2, "0")}:${m}`;
}

/**
 * Format a full date (YYYY-MM-DD) → "MMM DD, YYYY"
 * Example: "2025-09-18" → "Sep 18, 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "";
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split("-").map(Number);
    const localDate = new Date(y, m - 1, d);
    return localDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Format time and date together according to user's local timezone */
export function formatDateTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return { date: "", time: "" };

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date: formattedDate, time: formattedTime };
}

/* Format date and local time from UTC/server timestamp */
export function formatDateTimeWithLocalTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return { date: "", time: "" };

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  return { date: formattedDate, time: formattedTime };
}

// Compare two dates or times → true if start < end
export function isStartBeforeEnd(start, end) {
  if (!start || !end) return true;

  if (typeof start === "string" && typeof end === "string" && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em > sh * 60 + sm;
  }

  const startD = start instanceof Date ? start : parseDate(start) || new Date(start);
  const endD = end instanceof Date ? end : parseDate(end) || new Date(end);

  if (startD && !isNaN(startD.getTime()) && endD && !isNaN(endD.getTime())) {
    return startD.getTime() < endD.getTime();
  }

  return true;
}

// Convert local date/time string to standard UTC ISO string for backend
export function toLocalISOString(dateStr) {
  if (!dateStr) return "";
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? "" : dateStr.toISOString();
  }
  let safeStr = String(dateStr).trim();
  if (!safeStr) return "";

  // If already an ISO string with Z or offset, preserve as standard UTC ISO
  if (safeStr.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(safeStr)) {
    const d = new Date(safeStr);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  }

  // Date only: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(safeStr)) {
    safeStr += "T00:00:00";
  }

  // Local datetime: "YYYY-MM-DDTHH:mm"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(safeStr)) {
    safeStr += ":00";
  }

  const date = new Date(safeStr);
  if (!isNaN(date.getTime())) return date.toISOString();

  const parsed = parseDate(safeStr);
  return parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : "";
}

// Convert date string or timestamp to local system datetime string (YYYY-MM-DDTHH:mm)
export const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";

  // If already in local "YYYY-MM-DDTHH:mm" format (no timezone indicator), return directly
  if (typeof dateString === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString.trim())) {
    return dateString.trim();
  }

  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatForDateTimePicker = (dateString) => {
  return toDateTimeLocal(dateString);
};

// Get today's date in local YYYY-MM-DD format (safe for minDate pickers)
export const getTodayLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Check if a date/time is past or current
export const isPastOrCurrent = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() <= Date.now();
};