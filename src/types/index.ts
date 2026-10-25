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
}

export type EventCategory = 
  | 'Hackathons'
  | 'Technology'
  | 'AI & ML'
  | 'Design & UI/UX'
  | 'Startups & Business'
  | 'Education & Workshops'
  | 'Music & Arts'
  | 'Community & Social'
  | 'Networking';

export type EventFormat = 'in-person' | 'online' | 'hybrid';
export type EventStatus = 'published' | 'draft' | 'cancelled';

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
}
