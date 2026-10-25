import { EventItem } from '@/types';

function formatDateToICS(isoString: string): string {
  const date = new Date(isoString);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string
 */
export function generateICSContent(event: EventItem): string {
  const start = formatDateToICS(event.startTime);
  const end = formatDateToICS(event.endTime);
  const now = formatDateToICS(new Date().toISOString());
  const cleanSummary = (event.title || 'NearVibe Event').replace(/[\r\n]+/g, ' ');
  const cleanDescription = (event.description || '').replace(/\n/g, '\\n');
  const cleanLocation = `${event.venueName}, ${event.address}, ${event.city}`.replace(/[\r\n]+/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NearVibe//Hyperlocal Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nearvibe-${event.id}@nearvibe.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadEventICS(event: EventItem): void {
  if (typeof window === 'undefined') return;
  const icsContent = generateICSContent(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFilename = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 30);
  link.setAttribute('download', `${safeFilename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates Google Calendar web URL
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  const start = formatDateToICS(event.startTime);
  const end = formatDateToICS(event.endTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description}\n\nOrganized by: ${event.organizerName}\nPowered by NearVibe`,
    location: `${event.venueName}, ${event.address}, ${event.city}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
