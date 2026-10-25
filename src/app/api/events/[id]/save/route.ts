import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const result = await repo.toggleSaveEvent(id, userId);

    return NextResponse.json({
      success: true,
      isSaved: result.isSaved,
      message: result.isSaved ? 'Event saved to your bookmarks' : 'Event removed from bookmarks',
    });
  } catch (error: any) {
    console.error('API /api/events/[id]/save POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
