import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId') || undefined;
    const repo = getRepository();

    const teams = await repo.getSquadTeams();
    const matchedTeam = teamId ? teams.find(t => t.id === teamId) : undefined;
    const requests = matchedTeam ? (matchedTeam.joinRequests || []) : teams.flatMap(t => t.joinRequests || []);

    return NextResponse.json({ success: true, requests });
  } catch (err: any) {
    console.error('Error fetching join requests:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch join requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, eventId, userId, userName, userAvatar, role, message } = body;

    if (!teamId || !userId || !userName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: teamId, userId, userName, role' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const allTeams = await repo.getSquadTeams();
    const team = allTeams.find(t => t.id === teamId);

    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 });
    }

    const memberCount = team.currentMemberCount ?? team.currentMembers ?? 1;
    if (memberCount >= team.maxMembers || team.status === 'full') {
      return NextResponse.json(
        { success: false, error: 'This team has already reached its maximum capacity.' },
        { status: 400 }
      );
    }

    const isMember = team.members?.some((m: any) => m.userId === userId);
    if (isMember) {
      return NextResponse.json(
        { success: false, error: 'You are already a member of this team.' },
        { status: 400 }
      );
    }

    const created = await repo.requestJoinSquadTeam({
      teamId,
      eventId: eventId || team.eventId,
      applicantId: userId,
      applicantName: userName,
      applicantAvatar: userAvatar,
      appliedRole: role,
      note: message || `I would love to join as ${role}!`,
      skills: [],
    });

    return NextResponse.json({ success: true, request: created }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating join request:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit join request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, status, reviewerId } = body;

    if (!requestId || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid requestId or status' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const success = await repo.handleSquadJoinRequest(requestId, status, reviewerId || 'system');

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Request could not be updated or team is full' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('Error updating join request:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}
