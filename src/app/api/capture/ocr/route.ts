import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository';
import { parseEventAnnouncement } from '@/lib/utils/ocrParser';
import { detectDuplicates } from '@/lib/utils/duplicateDetector';
import { createWorker } from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let extractedText = '';
    let sourceType: 'poster_image' | 'pasted_text' = 'pasted_text';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const text = formData.get('text') as string | null;

      if (text && text.trim().length > 0) {
        extractedText = text.trim();
        sourceType = 'pasted_text';
      } else if (file) {
        sourceType = 'poster_image';
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, error: 'Unsupported file type. Please upload a JPEG, PNG, or WebP image.' },
            { status: 400 }
          );
        }
        // Limit to 10MB
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { success: false, error: 'Image file too large. Max size is 10MB.' },
            { status: 400 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Run Tesseract OCR
        try {
          const worker = await createWorker('eng');
          const ret = await worker.recognize(buffer);
          extractedText = ret.data.text;
          await worker.terminate();
        } catch (ocrErr: any) {
          console.error('OCR Processing error:', ocrErr);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to process image with OCR. You can paste the event announcement text directly or enter details manually.',
              rawError: ocrErr.message,
            },
            { status: 422 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: 'Please provide either an image file or announcement text.' },
          { status: 400 }
        );
      }
    } else {
      // JSON body
      const body = await request.json();
      if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: 'Please provide announcement text to extract.' },
          { status: 400 }
        );
      }
      extractedText = body.text.trim();
      sourceType = body.sourceType || 'pasted_text';
    }

    if (!extractedText || extractedText.trim().length < 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'No readable text could be extracted. Please check the image resolution or paste text manually.',
        },
        { status: 422 }
      );
    }

    // Parse structured draft
    const draft = parseEventAnnouncement(extractedText, sourceType);

    // Duplicate detection against existing events
    const repo = getRepository();
    const existingEvents = await repo.getEvents();
    const duplicateCheck = detectDuplicates(draft, existingEvents);

    return NextResponse.json({
      success: true,
      extractedText,
      draft,
      duplicateCheck,
    });
  } catch (err: any) {
    console.error('Error in /api/capture/ocr:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal extraction error' },
      { status: 500 }
    );
  }
}
