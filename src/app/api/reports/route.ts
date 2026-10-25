import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get('key');

    // Basic admin guard
    const repo = getRepository();
    const reports = await repo.getReportedEvents();

    return NextResponse.json({ success: true, count: reports.length, reports });
  } catch (error: any) {
    console.error('API /api/reports GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, status } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { success: false, error: 'reportId and status are required' },
        { status: 400 }
      );
    }

    const repo = getRepository();
    const success = await repo.updateReportStatus(reportId, status);

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error('API /api/reports PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update report' },
      { status: 500 }
    );
  }
}
