import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.reporterId || !body.reason) {
      return NextResponse.json(
        { success: false, error: 'Reporter ID and reason are required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const report = await repo.reportEvent(id, body.reporterId, body.reason, body.details);

    return NextResponse.json({
      success: true,
      message: 'Event report submitted for review. Thank you for keeping NearVibe safe.',
      report,
    });
  } catch (error: any) {
    console.error('API /api/events/[id]/report POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit report' },
      { status: 500 }
    );
  }
}
