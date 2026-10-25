import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  const isDemoExplicit = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';
  let dbConnected = false;

  if (!isDemoExplicit && process.env.DATABASE_URL) {
    try {
      dbConnected = await testConnection();
    } catch {
      dbConnected = false;
    }
  }

  return NextResponse.json({
    status: 'online',
    app: 'NearVibe',
    tagline: 'Discover nearby. Connect locally. Build community.',
    databaseConnected: dbConnected,
    mode: dbConnected ? 'PostgreSQL (Neon)' : 'Demo Mode (Persistent Local)',
    timestamp: new Date().toISOString(),
  });
}
