import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scoreEventForUser, rankEventsForUser } from './recommendations';
import { EventItem, UserProfile } from '@/types';

const mockUser: UserProfile = {
  id: 'user_1',
  name: 'Test Attendee',
  email: 'test@nearvibe.local',
  role: 'attendee',
  interests: ['Hackathons', 'AI & ML'],
  preferredCity: 'Noida',
  preferredRadiusKm: 25,
  latitude: 28.5355,
  longitude: 77.3910, // Noida
  createdAt: '2026-01-01T00:00:00Z',
};

const matchingNearbyEvent: EventItem = {
  id: 'evt-test-1',
  organizerId: 'org_1',
  organizerName: 'Tech Hub',
  title: 'AI Agents Hackathon Noida',
  description: 'Join builders in Noida for a 24-hr AI sprint.',
  category: 'Hackathons',
  tags: ['AI', 'Hackathon'],
  coverImage: 'https://example.com/cover.jpg',
  startTime: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
  endTime: new Date(Date.now() + 86400000 * 3).toISOString(),
  format: 'in-person',
  venueName: 'Sector 62 Hub',
  address: 'Sec 62',
  city: 'Noida',
  latitude: 28.5360,
  longitude: 77.3915, // ~100m away
  isFree: true,
  price: 0,
  capacity: 100,
  registeredCount: 85, // 85% filled -> high popularity
  status: 'published',
  createdAt: new Date().toISOString(),
};

const nonMatchingFarEvent: EventItem = {
  id: 'evt-test-2',
  organizerId: 'org_2',
  organizerName: 'Garden Club',
  title: 'Bonsai Pruning Demonstration',
  description: 'Learn ancient gardening techniques.',
  category: 'Community & Social',
  tags: ['Plants', 'Gardening'],
  coverImage: 'https://example.com/cover2.jpg',
  startTime: new Date(Date.now() + 86400000 * 20).toISOString(), // 20 days away
  endTime: new Date(Date.now() + 86400000 * 20 + 3600000 * 2).toISOString(),
  format: 'in-person',
  venueName: 'Distant Nursery',
  address: 'Far Out',
  city: 'Greater Noida',
  latitude: 28.3000,
  longitude: 77.5000, // ~30km away
  isFree: false,
  price: 200,
  capacity: 50,
  registeredCount: 5, // low fill
  status: 'published',
  createdAt: new Date().toISOString(),
};

describe('Transparent Recommendation Engine', () => {
  it('gives high score to an event matching user interests and located nearby', () => {
    const result = scoreEventForUser(matchingNearbyEvent, mockUser);
    assert.ok(result.score >= 80, `Expected score >= 80, got ${result.score}`);
    assert.ok(
      result.reason.toLowerCase().includes('matches your interest') ||
      result.reason.toLowerCase().includes('hackathon') ||
      result.reason.toLowerCase().includes('km away'),
      `Reason was: ${result.reason}`
    );
  });

  it('gives lower score to an event outside interests and far away', () => {
    const result = scoreEventForUser(nonMatchingFarEvent, mockUser);
    assert.ok(result.score < 50, `Expected score < 50, got ${result.score}`);
  });

  it('ranks matching nearby event strictly above irrelevant distant event', () => {
    const ranked = rankEventsForUser([nonMatchingFarEvent, matchingNearbyEvent], mockUser);
    assert.strictEqual(ranked[0].id, matchingNearbyEvent.id);
    assert.strictEqual(ranked[1].id, nonMatchingFarEvent.id);
    assert.ok(ranked[0].recommendationScore > ranked[1].recommendationScore);
  });

  it('gives cancelled events a score of zero', () => {
    const cancelledEvent = { ...matchingNearbyEvent, status: 'cancelled' as const };
    const result = scoreEventForUser(cancelledEvent, mockUser);
    assert.strictEqual(result.score, 0);
  });
});
