import moment from 'moment';

/**
 * Format a UTC datetime string from the database to the user's local timezone
 * @param utcDateString - ISO 8601 datetime string from database (assumed to be UTC)
 * @param format - Optional moment.js format string (default: 'MMM D, YYYY HH:mm:ss')
 * @returns Formatted date string in user's local timezone
 */
export function formatDateTime(
  utcDateString: string,
  format: string = 'MMM D, YYYY HH:mm:ss'
): string {
  if (!utcDateString) return 'N/A';

  // SQLite returns datetime in format: "YYYY-MM-DD HH:MM:SS"
  // Parse it as UTC and convert to local timezone
  const m = moment.utc(utcDateString).local();

  if (!m.isValid()) {
    console.error('Invalid date string:', utcDateString);
    return 'Invalid Date';
  }

  return m.format(format);
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "just now")
 * @param utcDateString - ISO 8601 datetime string from database (assumed to be UTC)
 * @returns Relative time string
 */
export function formatRelativeTime(utcDateString: string): string {
  if (!utcDateString) return 'N/A';

  const m = moment.utc(utcDateString).local();

  if (!m.isValid()) {
    return 'Invalid Date';
  }

  return m.fromNow();
}

/**
 * Format date for display with both absolute and relative time
 * @param utcDateString - ISO 8601 datetime string from database (assumed to be UTC)
 * @returns Object with formatted and relative time
 */
export function formatDateTimeFull(utcDateString: string): {
  formatted: string;
  relative: string;
  iso: string;
} {
  const m = moment.utc(utcDateString).local();

  return {
    formatted: formatDateTime(utcDateString),
    relative: formatRelativeTime(utcDateString),
    iso: m.toISOString(),
  };
}

/**
 * Get a moment object from UTC datetime string
 * Useful for custom formatting
 * @param utcDateString - ISO 8601 datetime string from database (assumed to be UTC)
 * @returns Moment object in local timezone
 */
export function getMoment(utcDateString: string): moment.Moment {
  return moment.utc(utcDateString).local();
}
