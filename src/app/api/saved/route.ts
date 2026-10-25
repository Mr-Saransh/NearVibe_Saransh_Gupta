import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const saved = await repo.getUserSavedEvents(userId);

    return NextResponse.json({ success: true, count: saved.length, events: saved });
  } catch (error: any) {
    console.error('API /api/saved GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch saved events' },
      { status: 500 }
    );
  }
}
