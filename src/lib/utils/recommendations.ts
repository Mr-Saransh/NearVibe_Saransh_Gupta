import { EventItem, UserProfile } from '@/types';
import { calculateDistance } from './geo';

export interface ScoredEvent extends EventItem {
  recommendationScore: number;
  recommendationReason: string;
}

/**
 * Computes transparent recommendation scores (0-100) based on documented weights:
 * - Interest & Tag Match: 40%
 * - Location / Proximity: 30%
 * - Date Freshness (Upcoming soon): 15%
 * - Community Popularity (Registered ratio): 15%
 */
export function scoreEventForUser(
  event: EventItem,
  user?: UserProfile | null,
  userLat?: number,
  userLng?: number
): { score: number; reason: string; distanceKm?: number } {
  // If event is cancelled, score is zero
  if (event.status === 'cancelled') {
    return { score: 0, reason: 'Event cancelled' };
  }

  let interestScore = 0;
  const reasons: string[] = [];

  const effectiveLat = userLat ?? user?.latitude;
  const effectiveLng = userLng ?? user?.longitude;

  // 1. Interest Match (Max 40 pts)
  if (user?.interests && user.interests.length > 0) {
    const userInterestsLower = user.interests.map((i) => i.toLowerCase());
    const matchesCategory = userInterestsLower.includes(event.category.toLowerCase());
    const matchingTags = event.tags.filter((t) =>
      userInterestsLower.includes(t.toLowerCase())
    );

    if (matchesCategory) {
      interestScore += 25;
      reasons.push(`Matches your interest in ${event.category}`);
    } else if (matchingTags.length > 0) {
      interestScore += 15;
      reasons.push(`Tags match your profile: ${matchingTags[0]}`);
    }
    // Additional points for multiple tag matches
    if (matchingTags.length > 1) {
      interestScore = Math.min(40, interestScore + 10);
    }
  } else {
    // Default baseline for general discovery
    interestScore = 15;
  }

  // 2. Proximity Match (Max 30 pts)
  let proximityScore = 0;
  let distanceKm: number | undefined;

  if (event.format === 'online') {
    proximityScore = 18; // Flat neutral score for virtual events
    reasons.push('Virtual stage accessible everywhere');
  } else if (
    effectiveLat !== undefined &&
    effectiveLng !== undefined &&
    event.latitude !== undefined &&
    event.longitude !== undefined
  ) {
    distanceKm = calculateDistance(
      effectiveLat,
      effectiveLng,
      event.latitude,
      event.longitude
    );

    const radius = user?.preferredRadiusKm || 30;

    if (distanceKm <= 5) {
      proximityScore = 30;
      reasons.push(`${distanceKm.toFixed(1)} km away • Hyperlocal`);
    } else if (distanceKm <= 15) {
      proximityScore = 24;
      reasons.push(`${distanceKm.toFixed(1)} km away in ${event.city}`);
    } else if (distanceKm <= radius) {
      proximityScore = 16;
      reasons.push(`Within your ${radius} km radius`);
    } else {
      proximityScore = Math.max(2, Math.round(30 - (distanceKm / radius) * 20));
    }
  } else {
    proximityScore = 12; // Moderate fallback when coordinates unavailable
  }

  // 3. Imminence & Registration Deadline Urgency (Max 15 pts)
  let dateScore = 0;
  const now = Date.now();
  const eventTime = new Date(event.startTime).getTime();
  const diffDays = (eventTime - now) / (1000 * 60 * 60 * 24);

  // Check deadline urgency
  if (event.registrationDeadline) {
    const deadlineTime = new Date(event.registrationDeadline).getTime();
    const deadlineDiffHours = (deadlineTime - now) / (1000 * 60 * 60);
    if (deadlineDiffHours > 0 && deadlineDiffHours <= 48) {
      dateScore += 15;
      reasons.push('Registration deadline approaching');
    }
  }

  if (diffDays >= 0 && diffDays <= 3) {
    dateScore = Math.max(dateScore, 15);
    reasons.push('Happening this week');
  } else if (diffDays > 3 && diffDays <= 7) {
    dateScore = Math.max(dateScore, 12);
  } else if (diffDays > 7 && diffDays <= 14) {
    dateScore = Math.max(dateScore, 8);
  } else if (diffDays > 14) {
    dateScore = Math.max(dateScore, 4);
  } else {
    dateScore = 0; // Past event
  }

  // 4. Popularity & Engagement (Max 15 pts)
  let popularityScore = 0;
  if (event.capacity > 0) {
    const fillRatio = event.registeredCount / event.capacity;
    if (fillRatio >= 0.8) {
      popularityScore = 15;
      reasons.push('Trending: High demand');
    } else if (fillRatio >= 0.5) {
      popularityScore = 10;
    } else {
      popularityScore = Math.round(fillRatio * 10);
    }
  }

  // 5. SquadUp & Source verification bonus
  if (event.category === 'Tech' && event.tags.some(t => t.toLowerCase().includes('hackathon'))) {
    reasons.push('SquadUp: Teammate matching active');
  }

  const totalScore = Math.min(
    100,
    Math.round(interestScore + proximityScore + dateScore + popularityScore)
  );

  // Pick the top 1-2 most informative reasons
  const displayReason =
    reasons.length > 0 ? reasons.slice(0, 2).join(' • ') : 'Recommended for you';

  return {
    score: totalScore,
    reason: displayReason,
    distanceKm,
  };
}

/**
 * Ranks and annotates events with transparent recommendation scores
 */
export function rankEventsForUser(
  events: EventItem[],
  user?: UserProfile | null,
  userLat?: number,
  userLng?: number
): ScoredEvent[] {
  return events
    .map((evt) => {
      const { score, reason, distanceKm } = scoreEventForUser(
        evt,
        user,
        userLat,
        userLng
      );
      return {
        ...evt,
        distanceKm: distanceKm ?? evt.distanceKm,
        recommendationScore: score,
        recommendationReason: reason,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
}
