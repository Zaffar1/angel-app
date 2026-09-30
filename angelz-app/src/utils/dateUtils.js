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
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    // }).toLowerCase();
  })
}

/* Format time and date together */
export function formatDateTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const date = new Date(dateStr);

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
    })
  // .toLowerCase();

  return { date: formattedDate, time: formattedTime };
}

export function formatDateTimeWithLocalTime(dateStr) {
  if (!dateStr) return { date: "", time: "" };

  const [datePart, timePart] = dateStr.split("T");
  const [year, month, day] = datePart.split("-");
  const [hour, minute] = timePart.split(":");

  const date = new Date(year, month - 1, day, hour, minute);

  const formattedDate = date.toLocaleDateString();
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

// convert time zone utc
export function toLocalISOString(dateStr) {
  const date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();
}

// convert time date to local system
export const toDateTimeLocal = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatForDateTimePicker = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('T') && dateString.endsWith('Z')) {
    return dateString;
  }
  const date = new Date(dateString);
  return date.toISOString();
};