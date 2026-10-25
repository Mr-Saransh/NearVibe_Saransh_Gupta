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
    const profile = await repo.getUserProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error('API /api/profile GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const updated = await repo.updateUserProfile(userId, {
      name: body.name,
      avatarUrl: body.avatarUrl,
      interests: body.interests,
      preferredCity: body.preferredCity,
      preferredRadiusKm: body.preferredRadiusKm,
    });

    return NextResponse.json({ success: true, profile: updated });
  } catch (error: any) {
    console.error('API /api/profile PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
