export type UserRole = 'attendee' | 'organizer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  interests: string[];
  preferredCity: string;
  preferredRadiusKm: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  // SquadUp profile integration
  squadProfile?: SquadProfile;
}

export type EventCategory = 
  | 'Hackathons'
  | 'Technology'
  | 'Tech'
  | 'AI & ML'
  | 'Design & UI/UX'
  | 'Startups & Business'
  | 'Business'
  | 'Education & Workshops'
  | 'Music & Arts'
  | 'Music'
  | 'Community & Social'
  | 'Community'
  | 'Networking'
  | 'Food'
  | 'Art'
  | 'Sports';

export type EventFormat = 'in-person' | 'online' | 'hybrid';
export type EventStatus = 'published' | 'draft' | 'cancelled';

export type TrustStatus =
  | 'organizer_verified' // Verified organizer identity via verified admin process
  | 'source_attached'    // Direct official link or validated poster attached
  | 'details_reviewed'   // Reviewed and confirmed by moderator/community
  | 'needs_review'       // Extracted draft needing manual verification
  | 'possible_duplicate' // Flagged by duplicate detection engine
  | 'deadline_passed'    // Registration deadline has passed
  | 'event_ended'        // Event end time has passed
  | 'event_cancelled';   // Cancelled

export type EventSourceType = 'poster_upload' | 'poster_image' | 'pasted_text' | 'url_import' | 'manual_entry' | 'direct_published';

export interface ExtractionMetadata {
  rawText?: string;
  confidence?: number;
  confidenceScore?: number;
  uncertainFields?: string[]; // e.g. ['startTime', 'venueName', 'price']
  uncertainFieldsCount?: number;
  rawCharacterCount?: number;
  ocrEngine?: string;
  extractedAt?: string;
  sourceUrl?: string;
  originalFileName?: string;
}

export interface EventItem {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  title: string;
  description: string;
  category: EventCategory;
  tags: string[];
  coverImage: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  format: EventFormat;
  venueName: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  isFree: boolean;
  price: number;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  featured?: boolean;
  createdAt: string;
  updatedAt?: string;
  // Feature A & B: Source, Trust & Freshness
  trustStatus: TrustStatus;
  sourceType?: EventSourceType;
  sourceUrl?: string;
  registrationDeadline?: string; // ISO string
  extractionMetadata?: ExtractionMetadata;
  duplicateOfId?: string;
  duplicateReason?: string;
  // Computed at query time relative to user position
  distanceKm?: number;
  recommendationScore?: number;
  recommendationReason?: string;
  isRegistered?: boolean;
  isSaved?: boolean;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  status: 'confirmed' | 'cancelled' | 'waitlist';
  createdAt: string;
  event?: EventItem;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  commentText: string;
  createdAt: string;
}

export interface EventReport {
  id: string;
  eventId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
  eventTitle?: string;
}

// -------------------------------------------------------------
// SQUADUP: Teammate Matching & Team Formation Types
// -------------------------------------------------------------
export type SquadExperience = 'Beginner' | 'Intermediate' | 'Advanced';
export type CollaborationStyle = 'In-Person' | 'Remote' | 'Hybrid' | 'flexible';

export interface EventDraft {
  title: string;
  organizerName?: string;
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
  capacity?: number;
  registrationLink?: string;
  sourceType: EventSourceType;
  sourceUrl?: string;
  description?: string;
  extractionMetadata: ExtractionMetadata;
  uncertainFields: string[];
  missingFields: string[];
}

export interface DuplicateMatch {
  event: EventItem;
  similarityScore: number;
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

export interface SquadProfile {
  userId: string;
  name: string;
  avatarUrl?: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  interests?: string[];
  preferredRoles: string[];
  experience?: SquadExperience;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  collaborationStyle: CollaborationStyle;
  contactVisible?: boolean;
  handle?: string; // Telegram / Discord handle
  githubUrl?: string;
  portfolioUrl?: string;
  updatedAt: string;
}

export interface SquadMember {
  userId: string;
  name?: string;
  userName?: string;
  avatarUrl?: string;
  userAvatar?: string;
  role: string;
  joinedAt: string;
  isLeader?: boolean;
}

export interface SquadTeam {
  id: string;
  eventId: string;
  eventTitle?: string;
  leaderId: string;
  leaderName: string;
  leaderAvatar?: string;
  teamName: string;
  name?: string;
  description: string;
  requiredRoles: string[];
  maxMembers: number;
  currentMemberCount: number;
  currentMembers?: number;
  members: SquadMember[];
  joinRequests?: SquadJoinRequest[];
  status: 'recruiting' | 'full' | 'closed';
  createdAt: string;
  updatedAt?: string;
  // Computed for matching
  matchScore?: number;
  matchReason?: string;
}

export interface SquadJoinRequest {
  id: string;
  teamId: string;
  eventId?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  role?: string;
  message?: string;
  applicantId?: string;
  applicantName?: string;
  applicantAvatar?: string;
  appliedRole?: string;
  note?: string;
  skills?: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

// -------------------------------------------------------------
// SMART WEEKEND PLANNER TYPES
// -------------------------------------------------------------
export type WeekendGoal = 
  | 'All-Rounder'
  | 'Learn a Skill'
  | 'Win Hackathons'
  | 'Startup Networking'
  | 'Creative & Arts'
  | 'Budget Friendly';

export type PlannerTimeWindow = 'all_day' | 'morning' | 'afternoon' | 'evening';

export interface PlannerPreferences {
  dateWindow: 'this_weekend' | 'saturday' | 'sunday' | 'custom';
  customDate?: string;
  timeWindow: PlannerTimeWindow;
  goal: WeekendGoal;
  maxBudget?: number;
  formatPreference: 'all' | EventFormat;
  maxEvents: number;
  maxDistanceKm?: number;
}

export interface ScheduledEventItem {
  event: EventItem;
  plannedStart: string;
  plannedEnd: string;
  selectionReason: string;
  slotIndex?: number;
  timeSlotLabel?: string;
  transitFromPrevious?: {
    distanceKm: number;
    estimatedMinutes: number;
    isEstimated: boolean;
  };
  conflictWarning?: string;
}

export interface WeekendItinerary {
  feasible?: boolean;
  schedule: ScheduledEventItem[];
  totalEvents: number;
  totalEstimatedCost: number;
  totalDurationHours: number;
  goalsAddressed: string[];
  warnings: string[];
}

// -------------------------------------------------------------
// FILTERS
// -------------------------------------------------------------
export type DateFilter = 'all' | 'today' | 'weekend' | 'month';
export type PriceFilter = 'all' | 'free' | 'paid';
export type SortOption = 'relevance' | 'nearest' | 'soonest' | 'popular';

export interface EventFilterParams {
  query?: string;
  category?: string;
  city?: string;
  dateRange?: DateFilter;
  format?: 'all' | EventFormat;
  priceType?: PriceFilter;
  maxDistanceKm?: number;
  userLat?: number;
  userLng?: number;
  sortBy?: SortOption;
  featuredOnly?: boolean;
  trustStatus?: TrustStatus;
  userGoal?: WeekendGoal;
}
