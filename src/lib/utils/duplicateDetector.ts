import { EventItem } from '@/types';

export interface DuplicateMatch {
  event: EventItem;
  similarityScore: number; // 0 to 100
  reasons: string[];
}

export interface DuplicateCheckResult {
  hasPotentialDuplicate: boolean;
  isDuplicate: boolean;
  topMatch?: DuplicateMatch;
  matches: DuplicateMatch[];
  matchedEvents: {
    eventId: string;
    existingTitle: string;
    confidenceScore: number;
    matchReason: string;
  }[];
}

/**
 * Tokenize and normalize text for similarity comparison
 */
function normalizeTokens(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/**
 * Calculates Jaccard similarity between two token sets
 */
function tokenSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : (intersection / union) * 100;
}

/**
 * Checks if two ISO date strings fall on the exact same calendar day
 */
function isSameDay(dateStr1?: string, dateStr2?: string): boolean {
  if (!dateStr1 || !dateStr2) return false;
  try {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
}

/**
 * Evaluates whether an incoming event draft is a duplicate of any existing listing
 */
export function detectDuplicates(
  draft: {
    title: string;
    startTime?: string;
    venueName?: string;
    city?: string;
    sourceUrl?: string;
  },
  existingEvents: EventItem[]
): DuplicateCheckResult {
  const matches: DuplicateMatch[] = [];
  const draftTokens = normalizeTokens(draft.title || '');

  for (const existing of existingEvents) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct Source URL match (instant high signal)
    if (
      draft.sourceUrl &&
      existing.sourceUrl &&
      draft.sourceUrl.trim().toLowerCase() === existing.sourceUrl.trim().toLowerCase()
    ) {
      score += 70;
      reasons.push('Identical source URL reference');
    }

    // 2. Title similarity
    const existingTokens = normalizeTokens(existing.title || '');
    const titleSim = tokenSimilarity(draftTokens, existingTokens);
    if (titleSim >= 75) {
      score += 45;
      reasons.push(`High title similarity (${Math.round(titleSim)}% token match)`);
    } else if (titleSim >= 40) {
      score += 25;
      reasons.push(`Moderate title similarity (${Math.round(titleSim)}%)`);
    }

    // 3. Same Day check
    if (draft.startTime && existing.startTime && isSameDay(draft.startTime, existing.startTime)) {
      score += 30;
      reasons.push('Scheduled on the exact same date');
    }

    // 4. Venue & City match
    if (
      draft.venueName &&
      existing.venueName &&
      draft.venueName.trim().length > 3 &&
      existing.venueName.toLowerCase().includes(draft.venueName.toLowerCase().trim())
    ) {
      score += 20;
      reasons.push(`Matching venue: "${existing.venueName}"`);
    } else if (
      draft.city &&
      existing.city &&
      draft.city.toLowerCase() === existing.city.toLowerCase()
    ) {
      score += 5;
    }

    const finalScore = Math.min(100, Math.round(score));

    // Threshold for potential duplicate flag: 50+
    if (finalScore >= 45) {
      matches.push({
        event: existing,
        similarityScore: finalScore,
        reasons,
      });
    }
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  const isDuplicate = matches.length > 0 && matches[0].similarityScore >= 45;
  const matchedEvents = matches.map((m) => ({
    eventId: m.event.id,
    existingTitle: m.event.title,
    confidenceScore: m.similarityScore,
    matchReason: m.reasons.join(' • '),
  }));

  return {
    hasPotentialDuplicate: isDuplicate,
    isDuplicate,
    topMatch: matches[0],
    matches,
    matchedEvents,
  };
}
