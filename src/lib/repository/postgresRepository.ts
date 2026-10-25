import { query } from '@/lib/db';
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
import { IEventRepository, OrganizerStats } from './types';
import { DEMO_ATTENDEE, DEMO_ORGANIZER } from '../data/seedData';
import { scoreTeamForMember } from '../utils/squadMatcher';

function mapRowToEvent(row: any, userId?: string): EventItem {
  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name || 'Community Organizer',
    organizerAvatar: row.organizer_avatar || undefined,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: Array.isArray(row.tags) ? row.tags : [],
    coverImage: row.cover_image,
    startTime: new Date(row.start_time).toISOString(),
    endTime: new Date(row.end_time).toISOString(),
    registrationDeadline: row.registration_deadline ? new Date(row.registration_deadline).toISOString() : undefined,
    format: row.format,
    venueName: row.venue_name,
    address: row.address,
    city: row.city,
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    isFree: Boolean(row.is_free),
    price: row.price ? parseFloat(row.price) : 0,
    capacity: parseInt(row.capacity, 10),
    registeredCount: parseInt(row.registered_count || '0', 10),
    status: row.status,
    featured: Boolean(row.featured),
    trustStatus: row.trust_status || 'details_reviewed',
    sourceType: row.source_type || 'direct_published',
    sourceUrl: row.source_url || undefined,
    extractionMetadata: row.extraction_metadata || undefined,
    duplicateOfId: row.duplicate_of_id || undefined,
    duplicateReason: row.duplicate_reason || undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    isRegistered: row.user_is_registered === 'true' || row.user_is_registered === true,
    isSaved: row.user_is_saved === 'true' || row.user_is_saved === true,
  };
}

export class PostgresRepository implements IEventRepository {
  async getEvents(params: EventFilterParams = {}, userId?: string): Promise<EventItem[]> {
    let sql = `
      SELECT 
        e.*,
        p.name as organizer_name,
        p.avatar_url as organizer_avatar,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as registered_count
        ${userId ? `, (EXISTS (SELECT 1 FROM registrations r2 WHERE r2.event_id = e.id AND r2.user_id = $${1} AND r2.status = 'confirmed')) as user_is_registered` : ''}
        ${userId ? `, (EXISTS (SELECT 1 FROM saved_events s WHERE s.event_id = e.id AND s.user_id = $${1})) as user_is_saved` : ''}
      FROM events e
      LEFT JOIN profiles p ON e.organizer_id = p.id
      WHERE e.status = 'published'
    `;

    const values: any[] = [];
    if (userId) {
      values.push(userId);
    }

    if (params.query) {
      values.push(`%${params.query}%`);
      sql += ` AND (e.title ILIKE $${values.length} OR e.description ILIKE $${values.length} OR e.venue_name ILIKE $${values.length} OR EXISTS (SELECT 1 FROM unnest(e.tags) tag WHERE tag ILIKE $${values.length}))`;
    }

    if (params.category && params.category !== 'All') {
      values.push(params.category);
      sql += ` AND e.category = $${values.length}`;
    }

    if (params.city && params.city !== 'All NCR') {
      values.push(`%${params.city}%`);
      sql += ` AND e.city ILIKE $${values.length}`;
    }

    if (params.format && params.format !== 'all') {
      values.push(params.format);
      sql += ` AND e.format = $${values.length}`;
    }

    if (params.priceType === 'free') {
      sql += ` AND e.is_free = true`;
    } else if (params.priceType === 'paid') {
      sql += ` AND e.is_free = false`;
    }

    if (params.featuredOnly) {
      sql += ` AND e.featured = true`;
    }

    if (params.trustStatus) {
      values.push(params.trustStatus);
      sql += ` AND e.trust_status = $${values.length}`;
    }

    sql += ` ORDER BY e.start_time ASC`;

    const rows = await query(sql, values);
    return rows.map((r) => mapRowToEvent(r, userId));
  }

  async getEventById(id: string, userId?: string): Promise<EventItem | null> {
    const values: any[] = [id];
    let userSelects = '';
    if (userId) {
      values.push(userId);
      userSelects = `, 
        (EXISTS (SELECT 1 FROM registrations r2 WHERE r2.event_id = e.id AND r2.user_id = $2 AND r2.status = 'confirmed')) as user_is_registered,
        (EXISTS (SELECT 1 FROM saved_events s WHERE s.event_id = e.id AND s.user_id = $2)) as user_is_saved
      `;
    }

    const sql = `
      SELECT 
        e.*,
        p.name as organizer_name,
        p.avatar_url as organizer_avatar,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as registered_count
        ${userSelects}
      FROM events e
      LEFT JOIN profiles p ON e.organizer_id = p.id
      WHERE e.id = $1
    `;

    const rows = await query(sql, values);
    if (!rows || rows.length === 0) return null;
    return mapRowToEvent(rows[0], userId);
  }

  async createEvent(data: Partial<EventItem> & { organizerId: string; title: string; category: string }): Promise<EventItem> {
    const id = `evt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const sql = `
      INSERT INTO events (
        id, organizer_id, title, description, category, tags, cover_image,
        start_time, end_time, registration_deadline, format, venue_name, address, city,
        latitude, longitude, is_free, price, capacity, status, featured,
        trust_status, source_type, source_url, extraction_metadata, duplicate_of_id, duplicate_reason
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING *
    `;

    const rows = await query(sql, [
      id,
      data.organizerId,
      data.title,
      data.description || '',
      data.category,
      data.tags || [],
      data.coverImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      data.startTime,
      data.endTime,
      data.registrationDeadline || null,
      data.format || 'in-person',
      data.venueName || 'To be announced',
      data.address || 'Delhi NCR',
      data.city || 'Noida',
      data.latitude || null,
      data.longitude || null,
      data.isFree ?? true,
      data.price || 0,
      data.capacity || 100,
      data.status || 'published',
      data.featured || false,
      data.trustStatus || (data.sourceType === 'poster_upload' || data.sourceType === 'url_import' ? 'source_attached' : 'details_reviewed'),
      data.sourceType || 'direct_published',
      data.sourceUrl || null,
      JSON.stringify(data.extractionMetadata || {}),
      data.duplicateOfId || null,
      data.duplicateReason || null,
    ]);

    return mapRowToEvent(rows[0]);
  }

  async updateEvent(id: string, updates: Partial<EventItem>, organizerId: string): Promise<EventItem> {
    const existing = await query('SELECT organizer_id FROM events WHERE id = $1', [id]);
    if (!existing || existing.length === 0) throw new Error('Event not found');
    if (existing[0].organizer_id !== organizerId && organizerId !== 'admin') {
      throw new Error('Unauthorized: You can only edit events you own');
    }

    const fields: string[] = [];
    const values: any[] = [id];

    const allowedFields: Record<string, string> = {
      title: 'title',
      description: 'description',
      category: 'category',
      tags: 'tags',
      coverImage: 'cover_image',
      startTime: 'start_time',
      endTime: 'end_time',
      registrationDeadline: 'registration_deadline',
      format: 'format',
      venueName: 'venue_name',
      address: 'address',
      city: 'city',
      latitude: 'latitude',
      longitude: 'longitude',
      isFree: 'is_free',
      price: 'price',
      capacity: 'capacity',
      status: 'status',
      featured: 'featured',
      trustStatus: 'trust_status',
    };

    for (const [key, col] of Object.entries(allowedFields)) {
      if ((updates as any)[key] !== undefined) {
        values.push((updates as any)[key]);
        fields.push(`${col} = $${values.length}`);
      }
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE events 
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const rows = await query(sql, values);
    return mapRowToEvent(rows[0]);
  }

  async cancelEvent(id: string, organizerId: string): Promise<boolean> {
    const existing = await query('SELECT organizer_id FROM events WHERE id = $1', [id]);
    if (!existing || existing.length === 0) return false;
    if (existing[0].organizer_id !== organizerId && organizerId !== 'admin') {
      throw new Error('Unauthorized: You can only cancel events you own');
    }

    await query("UPDATE events SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    return true;
  }

  async getUserRegistrations(userId: string): Promise<Registration[]> {
    const sql = `
      SELECT r.*, e.title, e.cover_image, e.start_time, e.venue_name, e.city, e.category, e.is_free, e.price
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1 AND r.status = 'confirmed'
      ORDER BY r.created_at DESC
    `;

    const rows = await query(sql, [userId]);
    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      event: {
        id: r.event_id,
        title: r.title,
        coverImage: r.cover_image,
        startTime: new Date(r.start_time).toISOString(),
        venueName: r.venue_name,
        city: r.city,
        category: r.category,
        isFree: r.is_free,
        price: parseFloat(r.price || '0'),
      } as any,
    }));
  }

  async registerForEvent(eventId: string, userId: string): Promise<{ success: boolean; error?: string; registration?: Registration }> {
    const eventRows = await query(
      `SELECT e.id, e.capacity, e.status, e.start_time, e.registration_deadline,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as registered_count
       FROM events e WHERE e.id = $1`,
      [eventId]
    );

    if (!eventRows || eventRows.length === 0) {
      return { success: false, error: 'Event not found' };
    }

    const event = eventRows[0];
    if (event.status !== 'published') {
      return { success: false, error: 'Event is not accepting registrations' };
    }

    if (parseInt(event.registered_count, 10) >= parseInt(event.capacity, 10)) {
      return { success: false, error: 'This event has reached full capacity' };
    }

    if (event.registration_deadline && new Date(event.registration_deadline).getTime() < Date.now()) {
      return { success: false, error: 'Registration deadline has passed' };
    }

    const existingReg = await query(
      `SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existingReg.length > 0) {
      if (existingReg[0].status === 'confirmed') {
        return { success: false, error: 'You are already registered for this event' };
      }
      const updated = await query(
        `UPDATE registrations SET status = 'confirmed', created_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
        [existingReg[0].id]
      );
      return {
        success: true,
        registration: {
          id: updated[0].id,
          eventId,
          userId,
          status: 'confirmed',
          createdAt: new Date(updated[0].created_at).toISOString(),
        },
      };
    }

    const regId = `reg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const res = await query(
      `INSERT INTO registrations (id, event_id, user_id, status) VALUES ($1, $2, $3, 'confirmed') RETURNING *`,
      [regId, eventId, userId]
    );

    return {
      success: true,
      registration: {
        id: res[0].id,
        eventId,
        userId,
        status: 'confirmed',
        createdAt: new Date(res[0].created_at).toISOString(),
      },
    };
  }

  async cancelRegistration(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    await query(
      `DELETE FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    return { success: true };
  }

  async getUserSavedEvents(userId: string): Promise<EventItem[]> {
    const sql = `
      SELECT 
        e.*,
        p.name as organizer_name,
        p.avatar_url as organizer_avatar,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') as registered_count,
        true as user_is_saved,
        (EXISTS (SELECT 1 FROM registrations r2 WHERE r2.event_id = e.id AND r2.user_id = $1 AND r2.status = 'confirmed')) as user_is_registered
      FROM saved_events s
      JOIN events e ON s.event_id = e.id
      LEFT JOIN profiles p ON e.organizer_id = p.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `;

    const rows = await query(sql, [userId]);
    return rows.map((r) => mapRowToEvent(r, userId));
  }

  async toggleSaveEvent(eventId: string, userId: string): Promise<{ isSaved: boolean }> {
    const existing = await query(
      `SELECT 1 FROM saved_events WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existing.length > 0) {
      await query(`DELETE FROM saved_events WHERE event_id = $1 AND user_id = $2`, [eventId, userId]);
      return { isSaved: false };
    } else {
      await query(`INSERT INTO saved_events (user_id, event_id) VALUES ($1, $2)`, [userId, eventId]);
      return { isSaved: true };
    }
  }

  async getEventComments(eventId: string): Promise<EventComment[]> {
    const rows = await query(
      `SELECT * FROM event_comments WHERE event_id = $1 ORDER BY created_at ASC`,
      [eventId]
    );
    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || undefined,
      commentText: r.comment_text,
      createdAt: new Date(r.created_at).toISOString(),
    }));
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

    const id = `cmt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const rows = await query(
      `INSERT INTO event_comments (id, event_id, user_id, author_name, author_avatar, comment_text)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, eventId, userId, authorName, authorAvatar || null, text.trim()]
    );

    const r = rows[0];
    return {
      id: r.id,
      eventId: r.event_id,
      userId: r.user_id,
      authorName: r.author_name,
      authorAvatar: r.author_avatar || undefined,
      commentText: r.comment_text,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async reportEvent(eventId: string, reporterId: string, reason: string, details?: string): Promise<EventReport> {
    const id = `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const rows = await query(
      `INSERT INTO event_reports (id, event_id, reporter_id, reason, details)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, eventId, reporterId, reason, details || null]
    );
    const r = rows[0];
    return {
      id: r.id,
      eventId: r.event_id,
      reporterId: r.reporter_id,
      reason: r.reason,
      details: r.details || undefined,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  async getReportedEvents(): Promise<EventReport[]> {
    const rows = await query(
      `SELECT r.*, e.title as event_title 
       FROM event_reports r
       JOIN events e ON r.event_id = e.id
       ORDER BY r.created_at DESC`
    );
    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      reporterId: r.reporter_id,
      reason: r.reason,
      details: r.details || undefined,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      eventTitle: r.event_title,
    }));
  }

  async updateReportStatus(reportId: string, status: 'pending' | 'reviewed' | 'dismissed'): Promise<boolean> {
    await query(`UPDATE event_reports SET status = $1 WHERE id = $2`, [status, reportId]);
    return true;
  }

  async getOrganizerStats(organizerId: string): Promise<OrganizerStats> {
    const sql = `
      SELECT 
        COUNT(*) as total_events,
        COALESCE(SUM((SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed')), 0) as total_registrations,
        COUNT(CASE WHEN e.start_time > CURRENT_TIMESTAMP AND e.status = 'published' THEN 1 END) as upcoming_events,
        COALESCE(AVG(e.capacity), 0) as avg_capacity
      FROM events e
      WHERE e.organizer_id = $1
    `;
    const rows = await query(sql, [organizerId]);
    const r = rows[0] || {};
    const totalEvents = parseInt(r.total_events || '0', 10);
    const totalRegistrations = parseInt(r.total_registrations || '0', 10);
    const upcomingEvents = parseInt(r.upcoming_events || '0', 10);
    const avgCapacity = parseFloat(r.avg_capacity || '100');
    const averageAttendance = totalEvents > 0 ? Math.round((totalRegistrations / (totalEvents * avgCapacity || 1)) * 100) : 0;

    return {
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      averageAttendance: Math.min(100, Math.max(0, averageAttendance)),
    };
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const rows = await query('SELECT * FROM profiles WHERE id = $1', [userId]);
    if (!rows || rows.length === 0) {
      if (userId === DEMO_ATTENDEE.id) return DEMO_ATTENDEE;
      if (userId === DEMO_ORGANIZER.id) return DEMO_ORGANIZER;
      return null;
    }
    const r = rows[0];
    const squadProfile = await this.getSquadProfile(userId);
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatar_url || undefined,
      role: r.role,
      interests: Array.isArray(r.interests) ? r.interests : [],
      preferredCity: r.preferred_city || 'Delhi NCR',
      preferredRadiusKm: parseInt(r.preferred_radius_km || '25', 10),
      createdAt: new Date(r.created_at).toISOString(),
      squadProfile: squadProfile || undefined,
    };
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const fields: string[] = [];
    const values: any[] = [userId];

    if (updates.name !== undefined) {
      values.push(updates.name);
      fields.push(`name = $${values.length}`);
    }
    if (updates.avatarUrl !== undefined) {
      values.push(updates.avatarUrl);
      fields.push(`avatar_url = $${values.length}`);
    }
    if (updates.interests !== undefined) {
      values.push(updates.interests);
      fields.push(`interests = $${values.length}`);
    }
    if (updates.preferredCity !== undefined) {
      values.push(updates.preferredCity);
      fields.push(`preferred_city = $${values.length}`);
    }
    if (updates.preferredRadiusKm !== undefined) {
      values.push(updates.preferredRadiusKm);
      fields.push(`preferred_radius_km = $${values.length}`);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `
      UPDATE profiles
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const rows = await query(sql, values);
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      avatarUrl: r.avatar_url || undefined,
      role: r.role,
      interests: Array.isArray(r.interests) ? r.interests : [],
      preferredCity: r.preferred_city,
      preferredRadiusKm: parseInt(r.preferred_radius_km || '25', 10),
      createdAt: new Date(r.created_at).toISOString(),
    };
  }

  // -------------------------------------------------------------
  // SQUADUP: PostgreSQL implementation
  // -------------------------------------------------------------
  async getSquadTeams(eventId?: string, userId?: string): Promise<SquadTeam[]> {
    let sql = `
      SELECT t.*, e.title as event_title, p.name as leader_name, p.avatar_url as leader_avatar
      FROM squad_teams t
      JOIN events e ON t.event_id = e.id
      JOIN profiles p ON t.leader_id = p.id
    `;
    const values: any[] = [];
    if (eventId) {
      values.push(eventId);
      sql += ` WHERE t.event_id = $1`;
    }
    sql += ` ORDER BY t.created_at DESC`;

    const rows = await query(sql, values);
    const profile = userId ? await this.getSquadProfile(userId) : null;

    const teams: SquadTeam[] = [];
    for (const r of rows) {
      // Fetch members
      const memberRows = await query(
        `SELECT m.*, p.name, p.avatar_url 
         FROM squad_members m 
         JOIN profiles p ON m.user_id = p.id 
         WHERE m.team_id = $1`,
        [r.id]
      );
      const members = memberRows.map((m) => ({
        userId: m.user_id,
        name: m.name,
        avatarUrl: m.avatar_url || undefined,
        role: m.role,
        joinedAt: new Date(m.joined_at).toISOString(),
        isLeader: Boolean(m.is_leader),
      }));

      const team: SquadTeam = {
        id: r.id,
        eventId: r.event_id,
        eventTitle: r.event_title,
        leaderId: r.leader_id,
        leaderName: r.leader_name,
        leaderAvatar: r.leader_avatar || undefined,
        teamName: r.team_name,
        name: r.team_name,
        description: r.description,
        requiredRoles: Array.isArray(r.required_roles) ? r.required_roles : [],
        maxMembers: parseInt(r.max_members, 10),
        currentMemberCount: members.length,
        currentMembers: members.length,
        members,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      };

      const match = scoreTeamForMember(team, profile);
      team.matchScore = match.score;
      team.matchReason = match.reason;
      teams.push(team);
    }

    return teams;
  }

  async createSquadTeam(data: {
    eventId: string;
    leaderId: string;
    leaderName: string;
    leaderAvatar?: string;
    teamName: string;
    description: string;
    requiredRoles: string[];
    maxMembers: number;
    leaderRole?: string;
  }): Promise<SquadTeam> {
    const id = `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO squad_teams (id, event_id, leader_id, team_name, description, required_roles, max_members, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'recruiting')`,
      [id, data.eventId, data.leaderId, data.teamName, data.description, data.requiredRoles, data.maxMembers || 4]
    );

    // Insert leader into squad_members
    await query(
      `INSERT INTO squad_members (team_id, user_id, role, is_leader)
       VALUES ($1, $2, $3, true)`,
      [id, data.leaderId, data.leaderRole || 'Team Leader']
    );

    return {
      id,
      eventId: data.eventId,
      leaderId: data.leaderId,
      leaderName: data.leaderName,
      leaderAvatar: data.leaderAvatar,
      teamName: data.teamName,
      description: data.description,
      requiredRoles: data.requiredRoles,
      maxMembers: data.maxMembers,
      currentMemberCount: 1,
      status: 'recruiting',
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: data.leaderId,
          name: data.leaderName,
          avatarUrl: data.leaderAvatar,
          role: data.leaderRole || 'Team Leader',
          joinedAt: new Date().toISOString(),
          isLeader: true,
        },
      ],
    };
  }

  async requestJoinSquadTeam(data: {
    teamId: string;
    eventId: string;
    applicantId: string;
    applicantName: string;
    applicantAvatar?: string;
    appliedRole: string;
    note?: string;
    skills?: string[];
  }): Promise<SquadJoinRequest> {
    const teamRows = await query(
      `SELECT t.*, (SELECT COUNT(*) FROM squad_members m WHERE m.team_id = t.id) as current_count
       FROM squad_teams t WHERE t.id = $1`,
      [data.teamId]
    );
    if (!teamRows || teamRows.length === 0) throw new Error('Team not found');

    const team = teamRows[0];
    if (parseInt(team.current_count, 10) >= parseInt(team.max_members, 10)) {
      throw new Error('This team is already at full capacity');
    }

    const id = `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO squad_join_requests (id, team_id, event_id, applicant_id, applied_role, note, skills, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [id, data.teamId, data.eventId, data.applicantId, data.appliedRole, data.note || null, data.skills || []]
    );

    return {
      id,
      teamId: data.teamId,
      eventId: data.eventId,
      applicantId: data.applicantId,
      applicantName: data.applicantName,
      applicantAvatar: data.applicantAvatar,
      appliedRole: data.appliedRole,
      note: data.note,
      skills: data.skills || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  }

  async handleSquadJoinRequest(requestId: string, status: 'accepted' | 'rejected', leaderId: string): Promise<boolean> {
    const reqRows = await query(
      `SELECT r.*, t.leader_id, t.max_members,
              (SELECT COUNT(*) FROM squad_members m WHERE m.team_id = t.id) as current_count,
              p.name as applicant_name, p.avatar_url as applicant_avatar
       FROM squad_join_requests r
       JOIN squad_teams t ON r.team_id = t.id
       JOIN profiles p ON r.applicant_id = p.id
       WHERE r.id = $1`,
      [requestId]
    );
    if (!reqRows || reqRows.length === 0) throw new Error('Request not found');

    const r = reqRows[0];
    if (r.leader_id !== leaderId && leaderId !== 'admin') {
      throw new Error('Unauthorized: Only team leader can review join requests');
    }

    await query(`UPDATE squad_join_requests SET status = $1 WHERE id = $2`, [status, requestId]);

    if (status === 'accepted') {
      if (parseInt(r.current_count, 10) >= parseInt(r.max_members, 10)) {
        throw new Error('Team is already full');
      }
      await query(
        `INSERT INTO squad_members (team_id, user_id, role, is_leader)
         VALUES ($1, $2, $3, false)
         ON CONFLICT DO NOTHING`,
        [r.team_id, r.applicant_id, r.applied_role]
      );
    }

    return true;
  }

  async leaveSquadTeam(teamId: string, userId: string): Promise<boolean> {
    await query(`DELETE FROM squad_members WHERE team_id = $1 AND user_id = $2`, [teamId, userId]);
    return true;
  }

  async getSquadProfile(userId: string): Promise<SquadProfile | null> {
    const rows = await query(`SELECT * FROM squad_profiles WHERE user_id = $1`, [userId]);
    if (!rows || rows.length === 0) {
      if (userId === DEMO_ATTENDEE.id) return DEMO_ATTENDEE.squadProfile || null;
      return null;
    }
    const r = rows[0];
    return {
      userId: r.user_id,
      name: r.name,
      avatarUrl: r.avatar_url || undefined,
      bio: r.bio || undefined,
      skills: Array.isArray(r.skills) ? r.skills : [],
      preferredRoles: Array.isArray(r.preferred_roles) ? r.preferred_roles : [],
      experience: r.experience || 'Intermediate',
      collaborationStyle: r.collaboration_style || 'In-Person',
      contactVisible: Boolean(r.contact_visible),
      handle: r.handle || undefined,
      githubUrl: r.github_url || undefined,
      portfolioUrl: r.portfolio_url || undefined,
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }

  async updateSquadProfile(userId: string, data: Partial<SquadProfile>): Promise<SquadProfile> {
    const existing = await query(`SELECT * FROM squad_profiles WHERE user_id = $1`, [userId]);
    if (existing.length === 0) {
      const user = await this.getUserProfile(userId);
      const res = await query(
        `INSERT INTO squad_profiles (user_id, name, avatar_url, bio, skills, preferred_roles, experience, collaboration_style, contact_visible, handle, github_url, portfolio_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          userId,
          data.name || user?.name || 'Builder',
          data.avatarUrl || user?.avatarUrl || null,
          data.bio || null,
          data.skills || [],
          data.preferredRoles || [],
          data.experience || 'Intermediate',
          data.collaborationStyle || 'In-Person',
          data.contactVisible ?? true,
          data.handle || null,
          data.githubUrl || null,
          data.portfolioUrl || null,
        ]
      );
      const r = res[0];
      return {
        userId: r.user_id,
        name: r.name,
        avatarUrl: r.avatar_url || undefined,
        bio: r.bio || undefined,
        skills: r.skills || [],
        preferredRoles: r.preferred_roles || [],
        experience: r.experience,
        collaborationStyle: r.collaboration_style,
        contactVisible: r.contact_visible,
        handle: r.handle || undefined,
        githubUrl: r.github_url || undefined,
        portfolioUrl: r.portfolio_url || undefined,
        updatedAt: new Date(r.updated_at).toISOString(),
      };
    }

    const res = await query(
      `UPDATE squad_profiles
       SET name = COALESCE($2, name),
           bio = COALESCE($3, bio),
           skills = COALESCE($4, skills),
           preferred_roles = COALESCE($5, preferred_roles),
           experience = COALESCE($6, experience),
           collaboration_style = COALESCE($7, collaboration_style),
           handle = COALESCE($8, handle),
           github_url = COALESCE($9, github_url),
           portfolio_url = COALESCE($10, portfolio_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [
        userId,
        data.name || null,
        data.bio || null,
        data.skills || null,
        data.preferredRoles || null,
        data.experience || null,
        data.collaborationStyle || null,
        data.handle || null,
        data.githubUrl || null,
        data.portfolioUrl || null,
      ]
    );

    const r = res[0];
    return {
      userId: r.user_id,
      name: r.name,
      avatarUrl: r.avatar_url || undefined,
      bio: r.bio || undefined,
      skills: r.skills || [],
      preferredRoles: r.preferred_roles || [],
      experience: r.experience,
      collaborationStyle: r.collaboration_style,
      contactVisible: r.contact_visible,
      handle: r.handle || undefined,
      githubUrl: r.github_url || undefined,
      portfolioUrl: r.portfolio_url || undefined,
      updatedAt: new Date(r.updated_at).toISOString(),
    };
  }
}
