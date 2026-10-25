import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');

    if (!organizerId) {
      return NextResponse.json(
        { success: false, error: 'organizerId parameter is required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const stats = await repo.getOrganizerStats(organizerId);

    // Also get the organizer's events
    const allEvents = await repo.getEvents({}, organizerId);
    const ownedEvents = allEvents.filter((e) => e.organizerId === organizerId);

    return NextResponse.json({
      success: true,
      stats,
      events: ownedEvents,
    });
  } catch (error: any) {
    console.error('API /api/organizer/stats GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch organizer stats' },
      { status: 500 }
    );
  }
}
