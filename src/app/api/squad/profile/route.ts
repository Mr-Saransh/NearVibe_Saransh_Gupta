import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { SquadProfile } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const profile = await repo.getSquadProfile(userId);
    return NextResponse.json({ success: true, profile: profile || null });
  } catch (err: any) {
    console.error('Error fetching squad profile:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch squad profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      name,
      avatar,
      bio,
      skills,
      interests,
      preferredRoles,
      experienceLevel,
      collaborationStyle,
      githubUrl,
      portfolioUrl,
    } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, error: 'User ID and name are required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const profileData: SquadProfile = {
      userId,
      name,
      avatar,
      bio: bio || '',
      skills: Array.isArray(skills) ? skills : [],
      interests: Array.isArray(interests) ? interests : [],
      preferredRoles: Array.isArray(preferredRoles) ? preferredRoles : [],
      experienceLevel: experienceLevel || 'intermediate',
      collaborationStyle: collaborationStyle || 'flexible',
      githubUrl,
      portfolioUrl,
      updatedAt: new Date().toISOString(),
    };

    const saved = await repo.updateSquadProfile(userId, profileData);
    return NextResponse.json({ success: true, profile: saved });
  } catch (err: any) {
    console.error('Error saving squad profile:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save squad profile' },
      { status: 500 }
    );
  }
}
