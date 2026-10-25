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
    const registrations = await repo.getUserRegistrations(userId);

    return NextResponse.json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error: any) {
    console.error('API /api/registrations GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
