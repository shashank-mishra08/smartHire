/**
 * Helper utilities for SmartHire backend
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (basic: at least 10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time for display (e.g., "10:00 AM")
 */
export function formatTime(hour: number, minute: number = 0): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Parse natural language date (basic)
 */
export function parseNaturalDate(text: string): Date | null {
  const lower = text.toLowerCase().trim();
  const now = new Date();

  if (lower === 'today') return now;
  if (lower === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (lower === 'day after tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return d;
  }

  // Try parsing as date string
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed;

  // Try common formats
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = dayNames.indexOf(lower);
  if (dayIndex !== -1) {
    const d = new Date(now);
    const currentDay = d.getDay();
    const daysUntil = (dayIndex - currentDay + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntil);
    return d;
  }

  return null;
}

/**
 * Generate a simple meet link placeholder (real one comes from Calendar API)
 */
export function generateMeetLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const part = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

/**
 * Get available time slots for a given date (mock for now, replaced by Calendar API)
 */
export function getDefaultTimeSlots(): string[] {
  return [
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
    '5:00 PM',
  ];
}
