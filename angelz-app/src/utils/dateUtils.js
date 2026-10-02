/**
 * Convert "HH:mm" (24h) string → "h:mm AM/PM"
 * Example: "13:45" → "1:45 PM"
 */
export function formatTime(value) {
  if (!value) return "";

  if (value.includes("T")) {
    const date = new Date(value);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  const [h, m] = value.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const adjusted = hour % 12 || 12;
  return `${adjusted}:${m} ${suffix}`;
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
  const date = typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T00:00:00`)
    : new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* Format time and date together */
export function formatDateTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { date: "", time: "" };

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  let formattedTime = date
    .toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return { date: formattedDate, time: formattedTime };
}

export function formatDateTimeWithLocalTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { date: "", time: "" };

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

// Compare two times (HH:mm format) → true if start < end
export function isStartBeforeEnd(start, end) {
  if (!start || !end) return true;

  if (start instanceof Date && end instanceof Date) {
    return start.getTime() < end.getTime();
  }

  const startDate = Date.parse(start);
  const endDate = Date.parse(end);
  if (!isNaN(startDate) && !isNaN(endDate)) {
    return startDate < endDate;
  }

  if (typeof start === "string" && typeof end === "string" && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)) {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh * 60 + em > sh * 60 + sm;
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(safeStr)) {
    safeStr += "T00:00:00";
  }
  const date = new Date(safeStr);
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
}

// Convert date string to local system datetime string (YYYY-MM-DDTHH:mm)
export const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatForDateTimePicker = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? '' : date.toISOString();
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