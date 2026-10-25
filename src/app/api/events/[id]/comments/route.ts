import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const repo = getRepository();
    const comments = await repo.getEventComments(id);
    return NextResponse.json({ success: true, count: comments.length, comments });
  } catch (error: any) {
    console.error('API /api/events/[id]/comments GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    if (!body.userId || !body.text) {
      return NextResponse.json(
        { success: false, error: 'User ID and comment text are required' },
        { status: 400 }
      );
    }

    if (body.text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Comment cannot be empty' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const newComment = await repo.addComment(
      id,
      body.userId,
      body.authorName || 'Community Member',
      body.authorAvatar,
      body.text
    );

    return NextResponse.json({ success: true, comment: newComment }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/events/[id]/comments POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post comment' },
      { status: 500 }
    );
  }
}
