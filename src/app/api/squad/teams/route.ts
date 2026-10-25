import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { SquadTeam } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || undefined;
    const repo = getRepository();

    const teams = await repo.getSquadTeams(eventId);
    return NextResponse.json({ success: true, teams });
  } catch (err: any) {
    console.error('Error fetching squad teams:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch squad teams' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      eventId,
      eventTitle,
      name,
      description,
      leaderId,
      leaderName,
      leaderAvatar,
      requiredRoles,
      maxMembers,
    } = body;

    if (!eventId || !name || !leaderId || !leaderName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: eventId, name, leaderId, leaderName' },
        { status: 400 }
      );
    }

    if (!requiredRoles || !Array.isArray(requiredRoles) || requiredRoles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please specify at least one required role for your team.' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const created = await repo.createSquadTeam({
      eventId,
      leaderId,
      leaderName,
      leaderAvatar,
      teamName: (name || '').trim(),
      description: (description || '').trim(),
      requiredRoles: requiredRoles.map((r: string) => r.trim()),
      maxMembers: Math.max(2, Math.min(10, Number(maxMembers) || 4)),
    });

    return NextResponse.json({ success: true, team: created }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating squad team:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to create squad team' },
      { status: 500 }
    );
  }
}
