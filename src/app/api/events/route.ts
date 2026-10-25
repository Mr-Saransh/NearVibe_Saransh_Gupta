import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { EventFilterParams } from '@/types';
import { calculateDistance } from '@/lib/utils/geo';
import { isDateToday, isDateThisWeekend, isDateThisMonth } from '@/lib/utils/date';
import { rankEventsForUser } from '@/lib/utils/recommendations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = getRepository();

    const query = searchParams.get('q') || undefined;
    const category = searchParams.get('category') || undefined;
    const city = searchParams.get('city') || undefined;
    const format = (searchParams.get('format') as any) || undefined;
    const priceType = (searchParams.get('priceType') as any) || undefined;
    const dateRange = (searchParams.get('dateRange') as any) || 'all';
    const sortBy = (searchParams.get('sortBy') as any) || 'relevance';
    const featuredOnly = searchParams.get('featured') === 'true';
    const userId = searchParams.get('userId') || undefined;

    const userLatParam = searchParams.get('userLat');
    const userLngParam = searchParams.get('userLng');
    const userLat = userLatParam ? parseFloat(userLatParam) : undefined;
    const userLng = userLngParam ? parseFloat(userLngParam) : undefined;

    const maxDistParam = searchParams.get('maxDistanceKm');
    const maxDistanceKm = maxDistParam ? parseFloat(maxDistParam) : undefined;

    const filterParams: EventFilterParams = {
      query,
      category,
      city,
      format,
      priceType,
      featuredOnly,
    };

    let events = await repo.getEvents(filterParams, userId);

    // Compute distances
    if (userLat !== undefined && userLng !== undefined) {
      events = events.map((e) => {
        if (e.latitude !== undefined && e.longitude !== undefined) {
          const dist = calculateDistance(userLat, userLng, e.latitude, e.longitude);
          return { ...e, distanceKm: dist };
        }
        return e;
      });

      // Filter by max distance if requested (exclude online from distance cutoff)
      if (maxDistanceKm && maxDistanceKm > 0) {
        events = events.filter((e) => {
          if (e.format === 'online') return true;
          return e.distanceKm !== undefined && e.distanceKm <= maxDistanceKm;
        });
      }
    }

    // Apply dateRange filter
    if (dateRange === 'today') {
      events = events.filter((e) => isDateToday(e.startTime));
    } else if (dateRange === 'weekend') {
      events = events.filter((e) => isDateThisWeekend(e.startTime));
    } else if (dateRange === 'month') {
      events = events.filter((e) => isDateThisMonth(e.startTime));
    }

    // Apply sorting
    if (sortBy === 'nearest' && userLat !== undefined && userLng !== undefined) {
      events.sort((a, b) => {
        if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
        if (a.distanceKm === undefined) return 1;
        if (b.distanceKm === undefined) return -1;
        return a.distanceKm - b.distanceKm;
      });
    } else if (sortBy === 'soonest') {
      events.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
    } else if (sortBy === 'popular') {
      events.sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    } else {
      // Relevance (scored recommendation ranking)
      let userProfile = null;
      if (userId) {
        userProfile = await repo.getUserProfile(userId);
      }
      events = rankEventsForUser(events, userProfile, userLat, userLng);
    }

    return NextResponse.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    console.error('API /api/events GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.title || body.title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Event title must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!body.startTime || !body.endTime) {
      return NextResponse.json(
        { success: false, error: 'Start and end time are required' },
        { status: 400 }
      );
    }

    const start = new Date(body.startTime);
    const end = new Date(body.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date/time format' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { success: false, error: 'End time must be strictly after start time' },
        { status: 400 }
      );
    }

    if (!body.organizerId) {
      return NextResponse.json(
        { success: false, error: 'Organizer ID is required' },
        { status: 401 }
      );
    }

    const repo = getRepository();
    const created = await repo.createEvent({
      organizerId: body.organizerId,
      organizerName: body.organizerName,
      organizerAvatar: body.organizerAvatar,
      title: body.title.trim(),
      description: body.description?.trim() || '',
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      coverImage: body.coverImage,
      startTime: body.startTime,
      endTime: body.endTime,
      format: body.format || 'in-person',
      venueName: body.venueName?.trim() || 'Venue TBD',
      address: body.address?.trim() || 'Delhi NCR',
      city: body.city || 'Noida',
      latitude: body.latitude,
      longitude: body.longitude,
      isFree: body.isFree ?? true,
      price: body.price ? parseFloat(body.price) : 0,
      capacity: body.capacity ? parseInt(body.capacity, 10) : 100,
      status: body.status || 'published',
      featured: Boolean(body.featured),
    });

    return NextResponse.json({ success: true, event: created }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/events POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create event' },
      { status: 500 }
    );
  }
}
