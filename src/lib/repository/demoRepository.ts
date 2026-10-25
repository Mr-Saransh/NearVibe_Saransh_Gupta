import {
  EventItem,
  EventFilterParams,
  Registration,
  EventComment,
  EventReport,
  UserProfile,
} from '@/types';
import { IEventRepository, OrganizerStats } from './types';
import {
  DEMO_ATTENDEE,
  DEMO_ORGANIZER,
  getInitialEvents,
  INITIAL_COMMENTS,
} from '../data/seedData';

const STORAGE_KEYS = {
  EVENTS: 'nearvibe_demo_events',
  REGISTRATIONS: 'nearvibe_demo_registrations',
  SAVED: 'nearvibe_demo_saved',
  COMMENTS: 'nearvibe_demo_comments',
  REPORTS: 'nearvibe_demo_reports',
  PROFILE: 'nearvibe_demo_profile',
};

// In-memory fallback for server-side execution
let memoryEvents: EventItem[] = getInitialEvents();
let memoryRegistrations: Registration[] = [
  {
    id: 'reg-demo-1',
    eventId: 'evt-001',
    userId: DEMO_ATTENDEE.id,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];
let memorySaved: string[] = ['evt-002'];
let memoryComments: EventComment[] = [...INITIAL_COMMENTS];
let memoryReports: EventReport[] = [];
let memoryProfile: UserProfile = { ...DEMO_ATTENDEE };

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getStored<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist to localStorage:', err);
  }
}

export class DemoRepository implements IEventRepository {
  private getEventsData(): EventItem[] {
    if (isClient()) {
      const stored = getStored<EventItem[]>(STORAGE_KEYS.EVENTS, []);
      if (stored.length > 0) return stored;
      const initial = getInitialEvents();
      setStored(STORAGE_KEYS.EVENTS, initial);
      return initial;
    }
    return memoryEvents;
  }

  private saveEventsData(events: EventItem[]): void {
    if (isClient()) {
      setStored(STORAGE_KEYS.EVENTS, events);
    } else {
      memoryEvents = events;
    }
  }

  private getRegistrationsData(): Registration[] {
    if (isClient()) {
      const stored = getStored<Registration[]>(STORAGE_KEYS.REGISTRATIONS, []);
      if (stored.length > 0) return stored;
      const initial: Registration[] = [
        {
          id: 'reg-demo-1',
          eventId: 'evt-001',
          userId: DEMO_ATTENDEE.id,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
        },
      ];
      setStored(STORAGE_KEYS.REGISTRATIONS, initial);
      return initial;
    }
    return memoryRegistrations;
  }

  private saveRegistrationsData(regs: Registration[]): void {
    if (isClient()) {
      setStored(STORAGE_KEYS.REGISTRATIONS, regs);
    } else {
      memoryRegistrations = regs;
    }
  }

  private getSavedIds(): string[] {
    if (isClient()) {
      const stored = getStored<string[]>(STORAGE_KEYS.SAVED, []);
      if (stored.length > 0) return stored;
      const initial = ['evt-002'];
      setStored(STORAGE_KEYS.SAVED, initial);
      return initial;
    }
    return memorySaved;
  }

  private saveSavedIds(ids: string[]): void {
    if (isClient()) {
      setStored(STORAGE_KEYS.SAVED, ids);
    } else {
      memorySaved = ids;
    }
  }

  async getEvents(params: EventFilterParams = {}, userId?: string): Promise<EventItem[]> {
    const all = this.getEventsData();
    const registrations = this.getRegistrationsData();
    const savedIds = this.getSavedIds();

    let filtered = all.filter((evt) => evt.status === 'published');

    if (params.query) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.venueName.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params.category && params.category !== 'All') {
      filtered = filtered.filter(
        (e) => e.category.toLowerCase() === params.category!.toLowerCase()
      );
    }

    if (params.city && params.city !== 'All NCR') {
      filtered = filtered.filter(
        (e) =>
          e.city.toLowerCase().includes(params.city!.toLowerCase()) ||
          params.city!.toLowerCase().includes(e.city.toLowerCase())
      );
    }

    if (params.format && params.format !== 'all') {
      filtered = filtered.filter((e) => e.format === params.format);
    }

    if (params.priceType === 'free') {
      filtered = filtered.filter((e) => e.isFree);
    } else if (params.priceType === 'paid') {
      filtered = filtered.filter((e) => !e.isFree);
    }

    if (params.featuredOnly) {
      filtered = filtered.filter((e) => e.featured);
    }

    // Decorate with user state
    return filtered.map((e) => {
      const isReg = userId
        ? registrations.some(
            (r) => r.eventId === e.id && r.userId === userId && r.status === 'confirmed'
          )
        : false;
      const isSaved = userId ? savedIds.includes(e.id) : false;
      return {
        ...e,
        isRegistered: isReg,
        isSaved,
      };
    });
  }

  async getEventById(id: string, userId?: string): Promise<EventItem | null> {
    const all = this.getEventsData();
    const found = all.find((e) => e.id === id);
    if (!found) return null;

    const registrations = this.getRegistrationsData();
    const savedIds = this.getSavedIds();

    return {
      ...found,
      isRegistered: userId
        ? registrations.some(
            (r) => r.eventId === id && r.userId === userId && r.status === 'confirmed'
          )
        : false,
      isSaved: userId ? savedIds.includes(id) : false,
    };
  }

  async createEvent(
    data: Partial<EventItem> & { organizerId: string; title: string; category: string }
  ): Promise<EventItem> {
    const all = this.getEventsData();
    const newEvent: EventItem = {
      id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      organizerId: data.organizerId,
      organizerName: data.organizerName || DEMO_ORGANIZER.name,
      organizerAvatar: data.organizerAvatar || DEMO_ORGANIZER.avatarUrl,
      title: data.title,
      description: data.description || '',
      category: data.category as any,
      tags: data.tags || ['Community'],
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      startTime: data.startTime || new Date(Date.now() + 86400000 * 3).toISOString(),
      endTime: data.endTime || new Date(Date.now() + 86400000 * 3 + 3600000 * 4).toISOString(),
      format: data.format || 'in-person',
      venueName: data.venueName || 'Auditorium & Coworking',
      address: data.address || 'Delhi NCR',
      city: data.city || 'Noida',
      latitude: data.latitude || 28.5355,
      longitude: data.longitude || 77.3910,
      isFree: data.isFree ?? true,
      price: data.price || 0,
      capacity: data.capacity || 100,
      registeredCount: 0,
      status: data.status || 'published',
      featured: data.featured || false,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newEvent);
    this.saveEventsData(all);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<EventItem>, organizerId: string): Promise<EventItem> {
    const all = this.getEventsData();
    const index = all.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Event not found');

    const current = all[index];
    if (current.organizerId !== organizerId && organizerId !== 'admin') {
      throw new Error('Unauthorized: You can only edit events you own');
    }

    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    all[index] = updated;
    this.saveEventsData(all);
    return updated;
  }

  async cancelEvent(id: string, organizerId: string): Promise<boolean> {
    const all = this.getEventsData();
    const index = all.findIndex((e) => e.id === id);
    if (index === -1) return false;

    if (all[index].organizerId !== organizerId && organizerId !== 'admin') {
      throw new Error('Unauthorized: You can only cancel events you own');
    }

    all[index].status = 'cancelled';
    this.saveEventsData(all);
    return true;
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    const regs = this.getRegistrationsData().filter(
      (r) => r.userId === userId && r.status === 'confirmed'
    );
    const events = this.getEventsData();

    return regs.map((r) => ({
      ...r,
      event: events.find((e) => e.id === r.eventId),
    }));
  }

  async registerForEvent(
    eventId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; registration?: Registration }> {
    const events = this.getEventsData();
    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) return { success: false, error: 'Event not found' };

    const event = events[eventIndex];
    if (event.status !== 'published') {
      return { success: false, error: 'Event is not accepting registrations' };
    }

    if (event.registeredCount >= event.capacity) {
      return { success: false, error: 'This event has reached full capacity' };
    }

    const regs = this.getRegistrationsData();
    const existing = regs.find((r) => r.eventId === eventId && r.userId === userId);

    if (existing && existing.status === 'confirmed') {
      return { success: false, error: 'You are already registered for this event' };
    }

    if (existing) {
      existing.status = 'confirmed';
      existing.createdAt = new Date().toISOString();
    } else {
      regs.push({
        id: `reg-demo-${Date.now()}`,
        eventId,
        userId,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });
    }

    // Increment count
    event.registeredCount += 1;
    this.saveEventsData(events);
    this.saveRegistrationsData(regs);

    return {
      success: true,
      registration: regs.find((r) => r.eventId === eventId && r.userId === userId),
    };
  }

  async cancelRegistration(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    let regs = this.getRegistrationsData();
    const target = regs.find((r) => r.eventId === eventId && r.userId === userId);
    if (!target) return { success: true };

    regs = regs.filter((r) => !(r.eventId === eventId && r.userId === userId));
    this.saveRegistrationsData(regs);

    const events = this.getEventsData();
    const event = events.find((e) => e.id === eventId);
    if (event && event.registeredCount > 0) {
      event.registeredCount -= 1;
      this.saveEventsData(events);
    }

    return { success: true };
  }

  async getUserSavedEvents(userId: string): Promise<EventItem[]> {
    const savedIds = this.getSavedIds();
    const all = this.getEventsData();
    return all
      .filter((e) => savedIds.includes(e.id))
      .map((e) => ({ ...e, isSaved: true }));
  }

  async toggleSaveEvent(eventId: string, userId: string): Promise<{ isSaved: boolean }> {
    let savedIds = this.getSavedIds();
    const exists = savedIds.includes(eventId);

    if (exists) {
      savedIds = savedIds.filter((id) => id !== eventId);
      this.saveSavedIds(savedIds);
      return { isSaved: false };
    } else {
      savedIds.push(eventId);
      this.saveSavedIds(savedIds);
      return { isSaved: true };
    }
  }

  async getEventComments(eventId: string): Promise<EventComment[]> {
    if (isClient()) {
      const stored = getStored<EventComment[]>(STORAGE_KEYS.COMMENTS, []);
      if (stored.length > 0) {
        return stored.filter((c) => c.eventId === eventId);
      }
      setStored(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
      return INITIAL_COMMENTS.filter((c) => c.eventId === eventId);
    }
    return memoryComments.filter((c) => c.eventId === eventId);
  }

  async addComment(
    eventId: string,
    userId: string,
    authorName: string,
    authorAvatar: string | undefined,
    text: string
  ): Promise<EventComment> {
    if (!text || text.trim().length === 0) {
      throw new Error('Comment text cannot be empty');
    }

    const newComment: EventComment = {
      id: `cmt-demo-${Date.now()}`,
      eventId,
      userId,
      authorName,
      authorAvatar,
      commentText: text.trim(),
      createdAt: new Date().toISOString(),
    };

    if (isClient()) {
      const stored = getStored<EventComment[]>(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
      stored.push(newComment);
      setStored(STORAGE_KEYS.COMMENTS, stored);
    } else {
      memoryComments.push(newComment);
    }

    return newComment;
  }

  async reportEvent(eventId: string, reporterId: string, reason: string, details?: string): Promise<EventReport> {
    const newReport: EventReport = {
      id: `rep-demo-${Date.now()}`,
      eventId,
      reporterId,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (isClient()) {
      const stored = getStored<EventReport[]>(STORAGE_KEYS.REPORTS, []);
      stored.unshift(newReport);
      setStored(STORAGE_KEYS.REPORTS, stored);
    } else {
      memoryReports.unshift(newReport);
    }

    return newReport;
  }

  async getReportedEvents(): Promise<EventReport[]> {
    if (isClient()) {
      return getStored<EventReport[]>(STORAGE_KEYS.REPORTS, []);
    }
    return memoryReports;
  }

  async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'dismissed'): Promise<boolean> {
    if (isClient()) {
      const stored = getStored<EventReport[]>(STORAGE_KEYS.REPORTS, []);
      const rep = stored.find((r) => r.id === reportId);
      if (rep) {
        rep.status = status;
        setStored(STORAGE_KEYS.REPORTS, stored);
        return true;
      }
    }
    const rep = memoryReports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      return true;
    }
    return false;
  }

  async getOrganizerStats(organizerId: string): Promise<OrganizerStats> {
    const all = this.getEventsData().filter((e) => e.organizerId === organizerId);
    const totalEvents = all.length;
    const totalRegistrations = all.reduce((acc, e) => acc + (e.registeredCount || 0), 0);
    const upcomingEvents = all.filter(
      (e) => new Date(e.startTime) > new Date() && e.status === 'published'
    ).length;
    const totalCapacity = all.reduce((acc, e) => acc + (e.capacity || 100), 0);
    const averageAttendance =
      totalEvents > 0 ? Math.round((totalRegistrations / (totalCapacity || 1)) * 100) : 0;

    return {
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      averageAttendance: Math.min(100, Math.max(0, averageAttendance)),
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (userId === DEMO_ORGANIZER.id) return DEMO_ORGANIZER;
    if (isClient()) {
      return getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEMO_ATTENDEE);
    }
    return memoryProfile;
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (isClient()) {
      const current = getStored<UserProfile>(STORAGE_KEYS.PROFILE, DEMO_ATTENDEE);
      const updated = { ...current, ...updates };
      setStored(STORAGE_KEYS.PROFILE, updated);
      return updated;
    }
    memoryProfile = { ...memoryProfile, ...updates };
    return memoryProfile;
  }
}
