import { EventItem, TrustStatus } from '@/types';

export interface TrustEvaluation {
  status: TrustStatus;
  badgeLabel: string;
  badgeColorClass: string;
  explanation: string;
  canRegister: boolean;
}

/**
 * Computes the honest trust and freshness status of an event at runtime
 */
export function evaluateEventTrust(event: EventItem): TrustEvaluation {
  const now = Date.now();
  const startTime = new Date(event.startTime).getTime();
  const endTime = new Date(event.endTime).getTime();

  // 1. Cancelled takes precedence
  if (event.status === 'cancelled') {
    return {
      status: 'event_cancelled',
      badgeLabel: 'Cancelled',
      badgeColorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      explanation: 'This event was cancelled by the organizer. No registrations are being accepted.',
      canRegister: false,
    };
  }

  // 2. Event ended check
  if (endTime < now) {
    return {
      status: 'event_ended',
      badgeLabel: 'Event Ended',
      badgeColorClass: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      explanation: 'This event has concluded. View recordings or future editions from this community.',
      canRegister: false,
    };
  }

  // 3. Registration deadline passed check
  if (event.registrationDeadline) {
    const deadlineTime = new Date(event.registrationDeadline).getTime();
    if (deadlineTime < now) {
      return {
        status: 'deadline_passed',
        badgeLabel: 'Deadline Passed',
        badgeColorClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        explanation: 'The registration deadline has passed. Late walk-ins depend on organizer venue availability.',
        canRegister: false,
      };
    }
  }

  // 4. Duplicate flag
  if (event.duplicateOfId) {
    return {
      status: 'possible_duplicate',
      badgeLabel: 'Possible Duplicate',
      badgeColorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-900',
      explanation: event.duplicateReason || 'This listing matches an existing event and is under review.',
      canRegister: true,
    };
  }

  // 5. Explicit Trust Status from Record
  switch (event.trustStatus) {
    case 'organizer_verified':
      return {
        status: 'organizer_verified',
        badgeLabel: 'Organizer Verified',
        badgeColorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        explanation: 'Organizer identity and credentials have been verified through our official vetting process.',
        canRegister: true,
      };

    case 'source_attached':
      return {
        status: 'source_attached',
        badgeLabel: 'Source Attached',
        badgeColorClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        explanation: 'Event listing includes original source poster or official public webpage reference.',
        canRegister: true,
      };

    case 'needs_review':
      return {
        status: 'needs_review',
        badgeLabel: 'Needs Review',
        badgeColorClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        explanation: 'Extracted automatically from a public flyer; venue or schedule details await community confirmation.',
        canRegister: true,
      };

    case 'details_reviewed':
    default:
      return {
        status: 'details_reviewed',
        badgeLabel: 'Details Reviewed',
        badgeColorClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
        explanation: 'Listing details have been reviewed for clarity, timing, and venue accuracy.',
        canRegister: true,
      };
  }
}
