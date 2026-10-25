import { EventCategory, EventFormat } from '@/types';

export interface ExtractedEventDraft {
  title: string;
  description: string;
  category: EventCategory;
  tags: string[];
  startTime: string;
  endTime: string;
  registrationDeadline?: string;
  format: EventFormat;
  venueName: string;
  address: string;
  city: string;
  isFree: boolean;
  price: number;
  capacity: number;
  registrationLink?: string;
  confidence: number;
  uncertainFields: string[];
  rawText: string;
}

/**
 * Heuristically parses raw announcement text (from OCR or user paste) into a structured event draft
 */
export function parseEventAnnouncementText(rawText: string): ExtractedEventDraft {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const textLower = rawText.toLowerCase();
  const uncertainFields: string[] = [];

  // 1. Detect Category
  let category: EventCategory = 'Technology';
  if (textLower.includes('hackathon') || textLower.includes('hack') || textLower.includes('code sprint') || textLower.includes('game jam')) {
    category = 'Hackathons';
  } else if (textLower.includes('ai') || textLower.includes('llm') || textLower.includes('machine learning') || textLower.includes('genai')) {
    category = 'AI & ML';
  } else if (textLower.includes('design') || textLower.includes('ui/ux') || textLower.includes('figma')) {
    category = 'Design & UI/UX';
  } else if (textLower.includes('pitch') || textLower.includes('startup') || textLower.includes('founder') || textLower.includes('investor')) {
    category = 'Startups & Business';
  } else if (textLower.includes('workshop') || textLower.includes('bootcamp') || textLower.includes('training') || textLower.includes('seminar')) {
    category = 'Education & Workshops';
  } else if (textLower.includes('music') || textLower.includes('art') || textLower.includes('concert') || textLower.includes('jam')) {
    category = 'Music & Arts';
  } else if (textLower.includes('cleanup') || textLower.includes('volunteer') || textLower.includes('ngo')) {
    category = 'Community & Social';
  }

  // 2. Detect Format
  let format: EventFormat = 'in-person';
  if (textLower.includes('online') || textLower.includes('zoom') || textLower.includes('virtual') || textLower.includes('google meet') || textLower.includes('discord')) {
    format = textLower.includes('hybrid') ? 'hybrid' : 'online';
  } else if (textLower.includes('hybrid')) {
    format = 'hybrid';
  }

  // 3. Detect Title
  // Priority: first non-trivial line that doesn't start with Date, Time, Venue
  let title = 'Community Event Announcement';
  for (const line of lines) {
    if (
      line.length >= 8 &&
      line.length <= 90 &&
      !line.toLowerCase().startsWith('date') &&
      !line.toLowerCase().startsWith('venue') &&
      !line.toLowerCase().startsWith('time') &&
      !line.toLowerCase().startsWith('register')
    ) {
      title = line;
      break;
    }
  }

  // 4. Detect Price & Free/Paid
  let isFree = true;
  let price = 0;
  const priceMatch = rawText.match(/(?:rs\.?|inr|₹)\s?(\d+(?:,\d+)?)/i);
  if (priceMatch) {
    price = parseFloat(priceMatch[1].replace(/,/g, ''));
    isFree = price === 0;
  } else if (textLower.includes('free entry') || textLower.includes('free registration') || textLower.includes('no fee') || textLower.includes('nil')) {
    isFree = true;
    price = 0;
  } else if (textLower.includes('paid') || textLower.includes('ticket')) {
    isFree = false;
    price = 299; // Default estimate
    uncertainFields.push('price');
  }

  // 5. Detect City & Venue
  let city = 'Noida';
  let venueName = 'Auditorium / Campus';
  if (textLower.includes('noida')) city = 'Noida';
  else if (textLower.includes('gurugram') || textLower.includes('gurgaon')) city = 'Gurugram';
  else if (textLower.includes('delhi')) city = 'Delhi';
  else if (textLower.includes('ghaziabad')) city = 'Ghaziabad';
  else if (textLower.includes('greater noida')) city = 'Greater Noida';
  else {
    uncertainFields.push('city');
  }

  // Look for venue keyword
  const venueMatch = rawText.match(/(?:venue|location|place|at):\s*([^\n\r]+)/i);
  if (venueMatch) {
    venueName = venueMatch[1].trim();
  } else {
    // Look for lines containing Auditorium, Campus, College, Center, Building
    const foundVenueLine = lines.find((l) =>
      /(auditorium|campus|hall|cowrks|hub|innov8|center|block)/i.test(l)
    );
    if (foundVenueLine) {
      venueName = foundVenueLine;
    } else {
      uncertainFields.push('venueName');
    }
  }

  // 6. Detect Dates & Deadlines
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 86400000 * 5); // 5 days out
  defaultStart.setHours(10, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 3600000 * 6);

  let startTime = defaultStart.toISOString();
  let endTime = defaultEnd.toISOString();
  let registrationDeadline: string | undefined = undefined;

  // Search for date patterns like "28 Oct", "October 28", "28/10/2026", "2026-11-15"
  const dateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})\b/i;
  const foundDate = rawText.match(dateRegex);

  if (foundDate) {
    try {
      const parsed = new Date(foundDate[1]);
      if (!isNaN(parsed.getTime())) {
        if (parsed.getFullYear() < 2026) parsed.setFullYear(2026);
        parsed.setHours(10, 0, 0, 0);
        startTime = parsed.toISOString();
        const end = new Date(parsed.getTime() + 3600000 * 6);
        endTime = end.toISOString();
      } else {
        uncertainFields.push('startTime');
      }
    } catch {
      uncertainFields.push('startTime');
    }
  } else {
    uncertainFields.push('startTime');
  }

  // Search for registration deadline
  const deadlineMatch = rawText.match(/(?:deadline|last date|register before|register by):\s*([^\n\r]+)/i);
  if (deadlineMatch) {
    try {
      const parsedDeadline = new Date(deadlineMatch[1].trim());
      if (!isNaN(parsedDeadline.getTime())) {
        if (parsedDeadline.getFullYear() < 2026) parsedDeadline.setFullYear(2026);
        registrationDeadline = parsedDeadline.toISOString();
      } else {
        uncertainFields.push('registrationDeadline');
      }
    } catch {
      uncertainFields.push('registrationDeadline');
    }
  }

  // 7. Detect Registration Link or URL
  let registrationLink: string | undefined = undefined;
  const urlMatch = rawText.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    registrationLink = urlMatch[0];
  }

  // 8. Generate Tags
  const tags: string[] = [category];
  if (category === 'Hackathons') tags.push('Coding', 'Collegiate', 'Prizes');
  else if (category === 'AI & ML') tags.push('LLMs', 'HandsOn', 'Python');
  else if (category === 'Startups & Business') tags.push('Founders', 'Networking', 'Mixer');
  else tags.push('Community', 'Learning');

  // Compute confidence score (100 - penalties for uncertain fields)
  const confidence = Math.max(30, 100 - uncertainFields.length * 15);

  return {
    title,
    description: lines.slice(0, 8).join('\n'),
    category,
    tags,
    startTime,
    endTime,
    registrationDeadline,
    format,
    venueName,
    address: `${venueName}, ${city}`,
    city,
    isFree,
    price,
    capacity: 100,
    registrationLink,
    confidence,
    uncertainFields,
    rawText,
  };
}

export function parseEventAnnouncement(
  rawText: string,
  sourceType: any = 'pasted_text',
  sourceUrl?: string
) {
  const extracted = parseEventAnnouncementText(rawText);
  return {
    ...extracted,
    sourceType,
    sourceUrl: sourceUrl || extracted.registrationLink,
    organizerName: '',
    missingFields: extracted.uncertainFields,
    extractionMetadata: {
      rawText: rawText.slice(0, 500),
      confidence: extracted.confidence,
      uncertainFields: extracted.uncertainFields,
      extractedAt: new Date().toISOString(),
      sourceUrl: sourceUrl || extracted.registrationLink,
    },
  };
}
