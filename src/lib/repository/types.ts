import {
  EventItem,
  EventFilterParams,
  Registration,
  EventComment,
  EventReport,
  UserProfile,
  SquadTeam,
  SquadProfile,
  SquadJoinRequest,
} from '@/types';

export interface OrganizerStats {
  totalEvents: number;
  totalRegistrations: number;
  upcomingEvents: number;
  averageAttendance: number;
}

export interface IEventRepository {
  getEvents(params?: EventFilterParams, userId?: string): Promise<EventItem[]>;
  getEventById(id: string, userId?: string): Promise<EventItem | null>;
  createEvent(data: Partial<EventItem> & { organizerId: string; title: string; category: string }): Promise<EventItem>;
  updateEvent(id: string, updates: Partial<EventItem>, organizerId: string): Promise<EventItem>;
  cancelEvent(id: string, organizerId: string): Promise<boolean>;
  getUserRegistrations(userId: string): Promise<Registration[]>;
  registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string; registration?: Registration }>;
  cancelRegistration(eventId: string, userId: string): Promise<{ success: boolean; error?: string }>;
  getUserSavedEvents(userId: string): Promise<EventItem[]>;
  toggleSaveEvent(eventId: string, userId: string): Promise<{ isSaved: boolean }>;
  getEventComments(eventId: string): Promise<EventComment[]>;
  addComment(eventId: string, userId: string, authorName: string, authorAvatar: string | undefined, text: string): Promise<EventComment>;
  reportEvent(eventId: string, reporterId: string, reason: string, details?: string): Promise<EventReport>;
  getReportedEvents(): Promise<EventReport[]>;
  updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'dismissed'): Promise<boolean>;
  getOrganizerStats(organizerId: string): Promise<OrganizerStats>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  // SquadUp Team formation
  getSquadTeams(eventId?: string, userId?: string): Promise<SquadTeam[]>;
  createSquadTeam(data: {
    eventId: string;
    leaderId: string;
    leaderName: string;
    leaderAvatar?: string;
    teamName: string;
    description: string;
    requiredRoles: string[];
    maxMembers: number;
    leaderRole?: string;
  }): Promise<SquadTeam>;
  requestJoinSquadTeam(data: {
    teamId: string;
    eventId: string;
    applicantId: string;
    applicantName: string;
    applicantAvatar?: string;
    appliedRole: string;
    note?: string;
    skills?: string[];
  }): Promise<SquadJoinRequest>;
  handleSquadJoinRequest(requestId: string, status: 'accepted' | 'rejected', leaderId: string): Promise<boolean>;
  leaveSquadTeam(teamId: string, userId: string): Promise<boolean>;
  getSquadProfile(userId: string): Promise<SquadProfile | null>;
  updateSquadProfile(userId: string, data: Partial<SquadProfile>): Promise<SquadProfile>;
}
