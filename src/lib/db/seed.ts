import fs from 'fs';
import path from 'path';
import { getDbPool, query } from './index';
import { DEMO_ATTENDEE, DEMO_ORGANIZER, getInitialEvents, INITIAL_COMMENTS, INITIAL_SQUAD_TEAMS } from '../data/seedData';

export async function initializeDatabase() {
  console.log('🔄 Initializing PostgreSQL database schema...');
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema
  const pool = getDbPool();
  await pool.query(schemaSql);
  console.log('✅ Schema executed successfully.');

  // Check if events exist
  const existingProfiles = await query<{ count: string }>('SELECT COUNT(*) as count FROM profiles');
  if (parseInt(existingProfiles[0]?.count || '0', 10) === 0) {
    console.log('🌱 Seeding initial profiles...');
    await query(
      `INSERT INTO profiles (id, name, email, avatar_url, role, interests, preferred_city, preferred_radius_km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        DEMO_ATTENDEE.id,
        DEMO_ATTENDEE.name,
        DEMO_ATTENDEE.email,
        DEMO_ATTENDEE.avatarUrl,
        DEMO_ATTENDEE.role,
        DEMO_ATTENDEE.interests,
        DEMO_ATTENDEE.preferredCity,
        DEMO_ATTENDEE.preferredRadiusKm,
      ]
    );

    await query(
      `INSERT INTO profiles (id, name, email, avatar_url, role, interests, preferred_city, preferred_radius_km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        DEMO_ORGANIZER.id,
        DEMO_ORGANIZER.name,
        DEMO_ORGANIZER.email,
        DEMO_ORGANIZER.avatarUrl,
        DEMO_ORGANIZER.role,
        DEMO_ORGANIZER.interests,
        DEMO_ORGANIZER.preferredCity,
        DEMO_ORGANIZER.preferredRadiusKm,
      ]
    );
  }

  const existingEvents = await query<{ count: string }>('SELECT COUNT(*) as count FROM events');
  if (parseInt(existingEvents[0]?.count || '0', 10) === 0) {
    console.log('🌱 Seeding initial events...');
    const events = getInitialEvents();
    for (const evt of events) {
      // Ensure organizer profile exists
      await query(
        `INSERT INTO profiles (id, name, email, avatar_url, role, interests, preferred_city)
         VALUES ($1, $2, $3, $4, 'organizer', $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          evt.organizerId,
          evt.organizerName,
          `${evt.organizerId}@nearvibe.local`,
          evt.organizerAvatar || null,
          ['Technology', 'Community'],
          evt.city,
        ]
      );

      await query(
        `INSERT INTO events (
          id, organizer_id, title, description, category, tags, cover_image,
          start_time, end_time, format, venue_name, address, city,
          latitude, longitude, is_free, price, capacity, status, featured,
          trust_status, source_type, source_url, registration_deadline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        ON CONFLICT (id) DO NOTHING`,
        [
          evt.id,
          evt.organizerId,
          evt.title,
          evt.description,
          evt.category,
          evt.tags,
          evt.coverImage,
          evt.startTime,
          evt.endTime,
          evt.format,
          evt.venueName,
          evt.address,
          evt.city,
          evt.latitude || null,
          evt.longitude || null,
          evt.isFree,
          evt.price,
          evt.capacity,
          evt.status,
          evt.featured || false,
          evt.trustStatus || 'details_reviewed',
          evt.sourceType || 'direct_published',
          evt.sourceUrl || null,
          evt.registrationDeadline || null,
        ]
      );
    }
    console.log(`✅ Seeded ${events.length} events into PostgreSQL.`);

    // Seed comments
    for (const c of INITIAL_COMMENTS) {
      await query(
        `INSERT INTO event_comments (id, event_id, user_id, author_name, author_avatar, comment_text, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.eventId, c.userId, c.authorName, c.authorAvatar || null, c.commentText, c.createdAt]
      );
    }

    // Seed one registration for Aarav Sharma to HackNCR
    await query(
      `INSERT INTO registrations (id, event_id, user_id, status)
       VALUES ('reg-001', 'evt-001', 'user_attendee_aarav', 'confirmed')
       ON CONFLICT DO NOTHING`
    );

    // Seed one saved event for Aarav Sharma to GenAI
    await query(
      `INSERT INTO saved_events (user_id, event_id)
       VALUES ('user_attendee_aarav', 'evt-002')
       ON CONFLICT DO NOTHING`
    );

    // Seed SquadUp Teams
    for (const team of INITIAL_SQUAD_TEAMS) {
      await query(
        `INSERT INTO squad_teams (
          id, event_id, leader_id, team_name, description, required_roles, max_members, current_members, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          team.id,
          team.eventId,
          team.leaderId,
          team.teamName || (team as any).name,
          team.description,
          team.requiredRoles,
          team.maxMembers,
          team.currentMemberCount || (team as any).currentMembers || 1,
          team.status,
        ]
      );

      if (team.members && team.members.length > 0) {
        for (const m of team.members) {
          await query(
            `INSERT INTO squad_members (team_id, user_id, role, is_leader, joined_at)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (team_id, user_id) DO NOTHING`,
            [team.id, m.userId, m.role, Boolean(m.isLeader), m.joinedAt]
          );
        }
      }
    }
    console.log(`✅ Seeded ${INITIAL_SQUAD_TEAMS.length} SquadUp teams.`);
  }

  console.log('🎉 Database initialization complete!');
}

// Allow direct CLI execution: npx tsx src/lib/db/seed.ts
if (require.main === module) {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
  initializeDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database initialization error:', err);
      process.exit(1);
    });
}
