/**
 * Human-friendly date and time formatting helpers
 */

export function formatEventDateTime(startIso: string, endIso?: string): string {
  try {
    const start = new Date(startIso);
    const datePart = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const startTimePart = start.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (!endIso) {
      return `${datePart} • ${startTimePart}`;
    }

    const end = new Date(endIso);
    const endTimePart = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Check if same day
    const isSameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (isSameDay) {
      return `${datePart} • ${startTimePart} - ${endTimePart}`;
    } else {
      const endDatePart = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${datePart}, ${startTimePart} - ${endDatePart}, ${endTimePart}`;
    }
  } catch {
    return startIso;
  }
}

export function formatEventDateOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatEventTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getRelativeDaysLabel(isoString: string): string {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(isoString);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) {
      return target.toLocaleDateString('en-US', { weekday: 'long' });
    }
    if (diffDays > 7) {
      return `In ${diffDays} days`;
    }
    return 'Past event';
  } catch {
    return '';
  }
}

export function isDateThisWeekend(isoString: string): boolean {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Distance to upcoming Saturday
    const daysUntilSaturday = (6 - currentDay + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSaturday);
    saturday.setHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    return d >= saturday && d <= sunday;
  } catch {
    return false;
  }
}

export function isDateToday(isoString: string): boolean {
  try {
    const d = new Date(isoString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch {
    return false;
  }
}

export function isDateThisMonth(isoString: string): boolean {
  try {
    const d = new Date(isoString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  } catch {
    return false;
  }
}
