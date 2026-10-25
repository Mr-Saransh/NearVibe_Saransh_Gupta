import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { buildWeekendItinerary } from '@/lib/utils/planner';
import { PlannerPreferences } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const preferences: PlannerPreferences = await request.json();

    const repo = getRepository();
    // Fetch all active/published events
    const allEvents = await repo.getEvents();

    const itinerary = buildWeekendItinerary(allEvents, preferences);

    return NextResponse.json({
      success: true,
      itinerary,
    });
  } catch (err: any) {
    console.error('Error generating weekend itinerary:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to build weekend schedule' },
      { status: 500 }
    );
  }
}
