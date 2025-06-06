import { formatInTimeZone } from 'date-fns-tz';
import parser from 'cron-parser';


// Common timezone options for the dropdown
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
];

/**
 * Get the user's detected timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Get a user-friendly timezone label
 */
export function getTimezoneLabel(timezone: string): string {
  const found = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (found) return found.label;
  
  // Fallback: format the timezone name
  return timezone.replace(/_/g, ' ').replace('/', ' - ');
}

/**
 * Convert a cron expression from user timezone to UTC
 * Uses cron-parser to handle the conversion properly
 */
export function convertCronToUTC(cronExpr: string, userTimezone: string): string {
  if (userTimezone === 'UTC') return cronExpr;

  try {

    const interval = parser.parse(cronExpr, { tz: userTimezone });
    const nextRun = interval.next().toDate();

    const utcHour = nextRun.getUTCHours();
    const utcMinute = nextRun.getUTCMinutes();
    const utcDay = nextRun.getUTCDay(); // 0 = Sunday

    const cronParts = cronExpr.trim().split(/\s+/);
    if (cronParts.length !== 5) return cronExpr;

    const [, , dayOfMonth, month, dayOfWeek] = cronParts;

    if (dayOfWeek === '*') {
      return `${utcMinute} ${utcHour} ${dayOfMonth} ${month} *`;
    }

    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      return `${utcMinute} ${utcHour} * * ${utcDay}`;
    }

    return `${utcMinute} ${utcHour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  } catch {
    // If conversion fails, return original expression
    return cronExpr;
  }
}

/**
 * Get the next run time in user's timezone
 */
export function getNextRunInTimezone(cronExpr: string, userTimezone: string): Date | null {
  try {
    const parser = require('cron-parser');
    const interval = parser.parse(cronExpr, { tz: userTimezone });
    console.log(interval.next().toDate());
    return interval.next().toDate();
  } catch {
    return null;
  }
}

/**
 * Format a date in the user's timezone using date-fns-tz
 */
export function formatDateInTimezone(date: Date, timezone: string): string {
  try {
    return formatInTimeZone(date, timezone, 'MMM d, yyyy h:mm a zzz');
  } catch {
    // Fallback to Intl.DateTimeFormat
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  }
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (target.getTime() - utc.getTime()) / 60000;
  } catch {
    return 0;
  }
}

/**
 * Check if a timezone observes daylight saving time
 */
export function observesDST(timezone: string): boolean {
  const jan = new Date(2024, 0, 1);
  const jul = new Date(2024, 6, 1);
  
  try {
    const janOffset = getTimezoneOffsetAt(timezone, jan);
    const julOffset = getTimezoneOffsetAt(timezone, jul);
    return janOffset !== julOffset;
  } catch {
    return false;
  }
}

function getTimezoneOffsetAt(timezone: string, date: Date): number {
  const utc = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
  return (target.getTime() - utc.getTime()) / 60000;
}
