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
        { success: false, error: 'User ID is required to register' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const result = await repo.registerForEvent(id, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration confirmed successfully',
      registration: result.registration,
    });
  } catch (error: any) {
    console.error('API /api/events/[id]/register POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const result = await repo.cancelRegistration(id, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to cancel registration' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successfully cancelled',
    });
  } catch (error: any) {
    console.error('API /api/events/[id]/register DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
