import { EventItem, PlannerPreferences, ScheduledEventItem, WeekendItinerary } from '@/types';
import { calculateDistance, formatDistance } from './geo';
import { isDateThisWeekend } from './date';

/**
 * Checks if an event matches the target weekend goal
 */
function getGoalMatchScore(event: EventItem, goal: string): { score: number; reason: string } {
  const title = event.title.toLowerCase();
  const desc = event.description.toLowerCase();
  const tags = event.tags.map((t) => t.toLowerCase());

  switch (goal) {
    case 'Learn a Skill':
      if (
        event.category === 'Education & Workshops' ||
        event.category === 'AI & ML' ||
        tags.includes('workshop') ||
        tags.includes('handson') ||
        tags.includes('learning')
      ) {
        return { score: 40, reason: `Matches your learning goal: hands-on ${event.category}` };
      }
      break;

    case 'Win Hackathons':
      if (
        event.category === 'Hackathons' ||
        title.includes('hackathon') ||
        title.includes('sprint') ||
        tags.includes('hackathon')
      ) {
        return { score: 45, reason: 'Targeted for collegiate builders & hackathon teams' };
      }
      break;

    case 'Startup Networking':
      if (
        event.category === 'Startups & Business' ||
        event.category === 'Networking' ||
        title.includes('mixer') ||
        title.includes('founder') ||
        title.includes('angel')
      ) {
        return { score: 40, reason: 'High-signal networking for founders & operators' };
      }
      break;

    case 'Creative & Arts':
      if (
        event.category === 'Music & Arts' ||
        event.category === 'Design & UI/UX' ||
        tags.includes('photography') ||
        tags.includes('design')
      ) {
        return { score: 40, reason: 'Creative cultural & artistic meetup' };
      }
      break;

    case 'Budget Friendly':
      if (event.isFree) {
        return { score: 35, reason: 'Zero admission fee (100% Free Entry)' };
      } else if (event.price <= 250) {
        return { score: 25, reason: `Affordable ticket (₹${event.price})` };
      }
      break;

    case 'All-Rounder':
    default:
      return { score: 20, reason: 'High community demand & popularity' };
  }

  return { score: 5, reason: 'General weekend activity' };
}

/**
 * Generates an optimized, collision-free weekend itinerary
 */
export function buildWeekendItinerary(
  allEvents: EventItem[],
  prefs: PlannerPreferences,
  userLat?: number,
  userLng?: number
): WeekendItinerary {
  const warnings: string[] = [];
  const goalsAddressed: Set<string> = new Set();

  // 1. Filter candidates by active status and date
  let candidates = allEvents.filter((e) => e.status === 'published');

  // Date filtering
  if (prefs.dateWindow === 'this_weekend') {
    candidates = candidates.filter((e) => isDateThisWeekend(e.startTime));
  } else if (prefs.dateWindow === 'saturday') {
    candidates = candidates.filter((e) => {
      const d = new Date(e.startTime);
      return d.getDay() === 6; // 6 is Saturday
    });
  } else if (prefs.dateWindow === 'sunday') {
    candidates = candidates.filter((e) => {
      const d = new Date(e.startTime);
      return d.getDay() === 0; // 0 is Sunday
    });
  }

  // Format preference
  if (prefs.formatPreference !== 'all') {
    candidates = candidates.filter((e) => e.format === prefs.formatPreference);
  }

  // Budget preference
  if (prefs.maxBudget !== undefined && prefs.maxBudget >= 0) {
    candidates = candidates.filter((e) => (e.isFree ? true : e.price <= prefs.maxBudget!));
  }

  // Time window filter
  if (prefs.timeWindow !== 'all_day') {
    candidates = candidates.filter((e) => {
      const startHour = new Date(e.startTime).getHours();
      if (prefs.timeWindow === 'morning') return startHour < 13;
      if (prefs.timeWindow === 'afternoon') return startHour >= 12 && startHour < 18;
      if (prefs.timeWindow === 'evening') return startHour >= 17;
      return true;
    });
  }

  // 2. Score candidates
  const scored = candidates.map((evt) => {
    const { score: goalScore, reason: goalReason } = getGoalMatchScore(evt, prefs.goal);
    let proximityScore = 0;
    let distKm: number | undefined = undefined;

    if (
      userLat !== undefined &&
      userLng !== undefined &&
      evt.latitude !== undefined &&
      evt.longitude !== undefined
    ) {
      distKm = calculateDistance(userLat, userLng, evt.latitude, evt.longitude);
      proximityScore = Math.max(0, 30 - distKm);
    }

    const totalScore = goalScore + proximityScore + (evt.featured ? 10 : 0);
    return {
      event: evt,
      score: totalScore,
      reason: goalReason,
      distKm,
    };
  });

  // Sort chronologically then by score
  scored.sort((a, b) => {
    const timeA = new Date(a.event.startTime).getTime();
    const timeB = new Date(b.event.startTime).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return b.score - a.score;
  });

  // 3. Build Non-Overlapping Schedule
  const schedule: ScheduledEventItem[] = [];
  let totalCost = 0;
  let totalDurationMs = 0;
  const maxEvents = Math.min(4, Math.max(1, prefs.maxEvents || 2));

  for (const item of scored) {
    if (schedule.length >= maxEvents) break;

    const eventStart = new Date(item.event.startTime).getTime();
    const eventEnd = new Date(item.event.endTime).getTime();

    // Check collision with already scheduled items
    let hasCollision = false;
    let transitInfo: ScheduledEventItem['transitFromPrevious'] = undefined;

    if (schedule.length > 0) {
      const previous = schedule[schedule.length - 1];
      const prevEnd = new Date(previous.event.endTime).getTime();

      // Estimate transit buffer if physical
      let bufferMs = 30 * 60 * 1000; // default 30 min buffer
      if (
        previous.event.latitude &&
        previous.event.longitude &&
        item.event.latitude &&
        item.event.longitude
      ) {
        const venueDist = calculateDistance(
          previous.event.latitude,
          previous.event.longitude,
          item.event.latitude,
          item.event.longitude
        );
        // Estimate 2.5 minutes per km in Delhi NCR traffic/metro + 15 min parking/check-in
        const transitMinutes = Math.round(venueDist * 2.5 + 15);
        bufferMs = transitMinutes * 60 * 1000;
        transitInfo = {
          distanceKm: venueDist,
          estimatedMinutes: transitMinutes,
          isEstimated: true,
        };
      } else if (previous.event.format === 'online' || item.event.format === 'online') {
        bufferMs = 10 * 60 * 1000; // 10 min virtual buffer
      } else {
        warnings.push(`Transit between "${previous.event.title}" and "${item.event.title}" could not be calculated (missing coordinates).`);
      }

      if (eventStart < prevEnd + bufferMs) {
        hasCollision = true; // Time overlap or insufficient travel buffer!
      }
    }

    if (!hasCollision) {
      schedule.push({
        event: item.event,
        plannedStart: item.event.startTime,
        plannedEnd: item.event.endTime,
        selectionReason: item.reason,
        transitFromPrevious: transitInfo,
      });

      totalCost += item.event.isFree ? 0 : item.event.price;
      totalDurationMs += eventEnd - eventStart;
      goalsAddressed.add(prefs.goal);
    }
  }

  if (schedule.length === 0) {
    warnings.push('No non-overlapping events found matching your exact window. Try choosing "All Day" or widening your budget.');
  }

  return {
    feasible: schedule.length > 0,
    schedule,
    totalEvents: schedule.length,
    totalEstimatedCost: totalCost,
    totalDurationHours: Math.round((totalDurationMs / (1000 * 60 * 60)) * 10) / 10,
    goalsAddressed: Array.from(goalsAddressed),
    warnings,
  };
}
