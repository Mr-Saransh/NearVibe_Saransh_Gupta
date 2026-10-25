import test from 'node:test';
import assert from 'node:assert/strict';
import { detectDuplicates } from './duplicateDetector';
import { parseEventAnnouncement } from './ocrParser';
import { validateSafeUrl } from './urlImport';
import { evaluateEventTrust } from './trust';
import { calculateSquadMatchScore } from './squadMatcher';
import { buildWeekendItinerary } from './planner';
import { EventItem, EventDraft, SquadTeam, SquadProfile, PlannerPreferences } from '@/types';

// Mock event helper
function createMockEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'evt_test_1',
    title: 'Delhi AI Agents Hackathon 2026',
    description: 'Build autonomous agents in Delhi',
    category: 'Tech',
    tags: ['hackathon', 'ai'],
    startTime: '2026-11-14T09:00:00Z',
    endTime: '2026-11-14T20:00:00Z',
    format: 'in-person',
    venueName: 'IIT Delhi Research Park',
    address: 'Hauz Khas',
    city: 'New Delhi',
    latitude: 28.545,
    longitude: 77.1926,
    isFree: true,
    price: 0,
    capacity: 200,
    registeredCount: 45,
    status: 'published',
    featured: true,
    organizerId: 'org_1',
    organizerName: 'Delhi Tech Hub',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    trustStatus: 'organizer_verified',
    ...overrides,
  };
}

test('Feature A: Duplicate Detection flags similar title and same-day events', () => {
  const existing = [createMockEvent()];
  const draft: EventDraft = {
    title: 'Delhi AI Agents Hackathon 2026',
    organizerName: 'Delhi Tech Club',
    category: 'Tech',
    tags: ['hackathon'],
    startTime: '2026-11-14T10:00:00Z',
    endTime: '2026-11-14T21:00:00Z',
    format: 'in-person',
    venueName: 'IIT Delhi',
    address: 'Hauz Khas',
    city: 'New Delhi',
    isFree: true,
    price: 0,
    sourceType: 'poster_image',
    extractionMetadata: {
      extractedAt: new Date().toISOString(),
      ocrEngine: 'tesseract.js',
      confidenceScore: 85,
      rawCharacterCount: 150,
      uncertainFieldsCount: 0,
    },
    uncertainFields: [],
    missingFields: [],
  };

  const check = detectDuplicates(draft, existing);
  assert.equal(check.isDuplicate, true);
  assert.ok(check.matchedEvents.length > 0);
  assert.ok(check.matchedEvents[0].confidenceScore >= 65);
  assert.ok(check.matchedEvents[0].matchReason.includes('title similarity') || check.matchedEvents[0].matchReason.includes('token match'));
});

test('Feature A: OCR Announcement Parser extracts title, venue, and deadline', () => {
  const announcement = `
    🚀 NOIDA AGENTIC CODING SPRINT 2026
    Host: Gamedev North & Tech Noida
    Date: Saturday, November 21, 2026 from 10:00 AM to 6:00 PM IST
    Venue: Sector 62 Innov8 Co-working, Noida
    Registration Deadline: November 18, 2026
    Entry: FREE! Swags and food included.
    Register at: https://noida-sprint.example.org/apply
  `;

  const draft = parseEventAnnouncement(announcement, 'pasted_text');
  assert.ok(draft.title.toLowerCase().includes('noida'));
  assert.equal(draft.city, 'Noida');
  assert.equal(draft.isFree, true);
  assert.ok(draft.venueName.includes('Innov8'));
  assert.ok(draft.registrationDeadline !== undefined);
});

test('Feature A: SSRF Defense blocks localhost, private IPs, and metadata services', () => {
  assert.equal(validateSafeUrl('http://localhost:3000/event').safe, false);
  assert.equal(validateSafeUrl('http://127.0.0.1:8080').safe, false);
  assert.equal(validateSafeUrl('http://169.254.169.254/latest/meta-data').safe, false);
  assert.equal(validateSafeUrl('http://192.168.1.1/admin').safe, false);
  assert.equal(validateSafeUrl('ftp://example.com/event').safe, false);

  // Valid public HTTPS URL
  assert.equal(validateSafeUrl('https://example.com/public-hackathon-2026').safe, true);
});

test('Feature B: Trust & Freshness correctly evaluates deadline expiry and cancellation', () => {
  // Cancelled event
  const cancelledEvt = createMockEvent({ status: 'cancelled' });
  const t1 = evaluateEventTrust(cancelledEvt);
  assert.equal(t1.status, 'event_cancelled');
  assert.equal(t1.canRegister, false);

  // Past event
  const pastEvt = createMockEvent({
    startTime: '2020-01-01T09:00:00Z',
    endTime: '2020-01-01T18:00:00Z',
  });
  const t2 = evaluateEventTrust(pastEvt);
  assert.equal(t2.status, 'event_ended');
  assert.equal(t2.canRegister, false);

  // Deadline passed event
  const deadlinePassedEvt = createMockEvent({
    startTime: '2027-01-01T09:00:00Z',
    endTime: '2027-01-01T18:00:00Z',
    registrationDeadline: '2020-01-01T23:59:00Z',
  });
  const t3 = evaluateEventTrust(deadlinePassedEvt);
  assert.equal(t3.status, 'deadline_passed');
  assert.equal(t3.canRegister, false);

  // Verified active event
  const activeEvt = createMockEvent({
    startTime: '2027-01-01T09:00:00Z',
    endTime: '2027-01-01T18:00:00Z',
    trustStatus: 'organizer_verified',
  });
  const t4 = evaluateEventTrust(activeEvt);
  assert.equal(t4.status, 'organizer_verified');
  assert.equal(t4.canRegister, true);
});

test('Feature C: SquadUp match scoring evaluates role and skill compatibility', () => {
  const team: SquadTeam = {
    id: 'squad_1',
    eventId: 'evt_1',
    eventTitle: 'Delhi Hackathon',
    name: 'NeuralHacks',
    description: 'Building multi-agent autonomous apps',
    leaderId: 'u_lead',
    leaderName: 'Lead Dev',
    requiredRoles: ['Frontend Developer', 'AI/ML Engineer'],
    maxMembers: 4,
    currentMembers: 2,
    status: 'recruiting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const matchingProfile: SquadProfile = {
    userId: 'u_cand',
    name: 'Candidate Dev',
    bio: 'Passionate frontend hacker',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS'],
    interests: ['AI', 'Tech'],
    preferredRoles: ['Frontend Developer'],
    experienceLevel: 'intermediate',
    collaborationStyle: 'flexible',
    updatedAt: new Date().toISOString(),
  };

  const match = calculateSquadMatchScore(team, matchingProfile);
  assert.ok(match.score >= 50);
  assert.ok(match.explanations.some(e => e.includes('Frontend Developer')));
});

test('Feature D: Weekend Planner produces non-overlapping itinerary', () => {
  // 3 events on same Saturday:
  // Evt A: 09:00 - 12:00
  // Evt B: 10:00 - 14:00 (Overlaps with A!)
  // Evt C: 14:30 - 18:00 (Non-overlapping with A after transit buffer)
  const evtA = createMockEvent({
    id: 'evt_a',
    title: 'Morning AI Sprint',
    startTime: '2026-11-14T09:00:00Z',
    endTime: '2026-11-14T12:00:00Z',
  });
  const evtB = createMockEvent({
    id: 'evt_b',
    title: 'Conflicting Midday Jam',
    startTime: '2026-11-14T10:00:00Z',
    endTime: '2026-11-14T14:00:00Z',
  });
  const evtC = createMockEvent({
    id: 'evt_c',
    title: 'Evening Founder Mixer',
    startTime: '2026-11-14T15:00:00Z',
    endTime: '2026-11-14T18:00:00Z',
  });

  const prefs: PlannerPreferences = {
    goal: 'Learn a Skill',
    dateWindow: 'saturday',
    timeWindow: 'all_day',
    formatPreference: 'all',
    maxEvents: 3,
  };

  const itinerary = buildWeekendItinerary([evtA, evtB, evtC], prefs);
  assert.equal(itinerary.feasible, true);
  // Collision detection MUST have excluded evtB
  const scheduledIds = itinerary.schedule.map(s => s.event.id);
  assert.ok(scheduledIds.includes('evt_a'));
  assert.ok(scheduledIds.includes('evt_c'));
  assert.equal(scheduledIds.includes('evt_b'), false, 'Conflicting event B must not be scheduled');
});
