import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const repo = getRepository();
    const event = await repo.getEventById(id, userId);

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error('API /api/events/[id] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.organizerId) {
      return NextResponse.json(
        { success: false, error: 'Organizer ID required for authorization' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const updated = await repo.updateEvent(id, body, body.organizerId);

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    console.error('API /api/events/[id] PATCH Error:', error);
    const status = error.message?.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update event' },
      { status }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizerId');

    if (!organizerId) {
      return NextResponse.json(
        { success: false, error: 'Organizer ID required for authorization' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const success = await repo.cancelEvent(id, organizerId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel event' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Event successfully cancelled' });
  } catch (error: any) {
    console.error('API /api/events/[id] DELETE Error:', error);
    const status = error.message?.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel event' },
      { status }
    );
  }
}
