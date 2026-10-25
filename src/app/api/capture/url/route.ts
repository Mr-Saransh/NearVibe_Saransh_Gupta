import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { fetchPublicEventPage, validateSafeUrl } from '@/lib/utils/urlImport';
import { parseEventAnnouncement } from '@/lib/utils/ocrParser';
import { detectDuplicates } from '@/lib/utils/duplicateDetector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid public event URL is required.' },
        { status: 400 }
      );
    }

    // SSRF and protocol check
    const validation = validateSafeUrl(url);
    if (!validation.safe) {
      return NextResponse.json(
        { success: false, error: validation.reason || 'Unsafe URL target rejected.' },
        { status: 400 }
      );
    }

    // Fetch public content with timeouts and size limits
    const fetchResult = await fetchPublicEventPage(url);
    if (!fetchResult.success || !fetchResult.text) {
      return NextResponse.json(
        {
          success: false,
          error: fetchResult.error || 'Could not fetch public page content.',
          details: 'Sites with strict anti-bot measures, JavaScript SPAs, or login requirements may not be fetchable. Please copy & paste the text directly into NearVibe.',
        },
        { status: 422 }
      );
    }

    // Parse structured draft
    const draft = parseEventAnnouncement(fetchResult.text, 'url_import', url);

    // If page had an extracted title and parser didn't catch one
    if (fetchResult.title && (!draft.title || draft.title === 'Untitled Event')) {
      draft.title = fetchResult.title;
      draft.uncertainFields = draft.uncertainFields.filter(f => f !== 'title');
    }

    // Duplicate detection against existing events
    const repo = getRepository();
    const existingEvents = await repo.getEvents();
    const duplicateCheck = detectDuplicates(draft, existingEvents);

    return NextResponse.json({
      success: true,
      url,
      pageTitle: fetchResult.title,
      rawTextSnippet: fetchResult.text.slice(0, 500),
      draft,
      duplicateCheck,
    });
  } catch (err: any) {
    console.error('Error in /api/capture/url:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'URL import failed' },
      { status: 500 }
    );
  }
}
