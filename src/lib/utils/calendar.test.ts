import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateICSContent, getGoogleCalendarUrl } from './calendar';
import { EventItem } from '@/types';

const testEvent: EventItem = {
  id: 'evt-cal-1',
  organizerId: 'org_1',
  organizerName: 'Dev Guild',
  title: 'Next.js 16 Conference',
  description: 'Exploring React 19 and Next.js 16 App Router.',
  category: 'Technology',
  tags: ['Nextjs', 'React'],
  coverImage: 'https://example.com/cover.jpg',
  startTime: '2026-11-15T10:00:00.000Z',
  endTime: '2026-11-15T16:00:00.000Z',
  format: 'in-person',
  venueName: 'Pragati Maidan Auditorium',
  address: 'Mathura Road',
  city: 'Delhi',
  isFree: true,
  price: 0,
  capacity: 200,
  registeredCount: 150,
  status: 'published',
  trustStatus: 'organizer_verified',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('Calendar Integration Utilities', () => {
  it('generates a valid RFC 5545 iCalendar string', () => {
    const ics = generateICSContent(testEvent);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('SUMMARY:Next.js 16 Conference'));
    assert.ok(ics.includes('LOCATION:Pragati Maidan Auditorium, Mathura Road, Delhi'));
    assert.ok(ics.includes('DTSTART:20261115T100000Z'));
    assert.ok(ics.includes('DTEND:20261115T160000Z'));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  it('generates a valid Google Calendar template URL', () => {
    const url = getGoogleCalendarUrl(testEvent);
    assert.ok(url.startsWith('https://calendar.google.com/calendar/render?'));
    assert.ok(url.includes('action=TEMPLATE'));
    assert.ok(url.includes('Next.js+16+Conference') || url.includes('Next.js%2016%20Conference'));
  });
});
