import { query } from '@/lib/db';
import {
  EventItem,
  EventFilterParams,
  Registration,
  EventComment,
  EventReport,
  UserProfile,
} from '@/types';
import { IEventRepository, OrganizerStats } from './types';
import { DEMO_ATTENDEE, DEMO_ORGANIZER } from '../data/seedData';

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
        start_time, end_time, format, venue_name, address, city,
        latitude, longitude, is_free, price, capacity, status, featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
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
    ]);

    return mapRowToEvent(rows[0]);
  }

  async updateEvent(id: string, updates: Partial<EventItem>, organizerId: string): Promise<EventItem> {
    // Validate ownership
    const existing = await query('SELECT organizer_id FROM events WHERE id = $1', [id]);
    if (!existing || existing.length === 0) {
      throw new Error('Event not found');
    }
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
    // 1. Check event validity and capacity
    const eventRows = await query(
      `SELECT e.id, e.capacity, e.status, e.start_time,
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

    // 2. Check for duplicate active registration
    const existingReg = await query(
      `SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );

    if (existingReg.length > 0) {
      if (existingReg[0].status === 'confirmed') {
        return { success: false, error: 'You are already registered for this event' };
      }
      // Re-activate cancelled registration
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

    // 3. Insert new registration
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
    const res = await query(
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
}
