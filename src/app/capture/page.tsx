'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Eye,
  AlertCircle,
  ShieldAlert,
  Calendar,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  Info,
  DollarSign,
  Tag,
  Globe,
} from 'lucide-react';
import { EventDraft, DuplicateCheckResult, EventCategory, EventFormat } from '@/types';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

type InputMode = 'poster' | 'text' | 'url';

const SAMPLE_POSTER_TEXTS = [
  {
    label: 'Delhi AI & Agentic Hackathon 2026',
    text: `🚀 DELHI AI & AGENTIC HACKATHON 2026
Presented by Delhi Tech Club & AI Innovators Hub
Date: Saturday, November 14, 2026
Time: 9:00 AM - 8:00 PM IST
Registration Deadline: November 10, 2026
Venue: IIT Delhi Research Park, Hauz Khas, New Delhi
Category: Tech
Entry: FREE (Food & Swags provided!)
Build autonomous AI agents, multi-agent systems, and production apps. Win from ₹2,00,000 prize pool!
Register at: https://delhiai.example.com/register
Roles needed: Python, LLMs, Full-Stack, UI/UX`,
  },
  {
    label: 'Noida Indie Game Developers Meetup',
    text: `🎮 NOIDA INDIE GAME JAM & SHOWCASE
Host: Gamedev North
When: Sunday, November 22, 2026 from 2:00 PM to 6:30 PM
Where: Sector 62 Innov8 Co-working, Noida, Uttar Pradesh
Tickets: ₹299 (Covers refreshments & high-speed LAN)
Showcase your indie games, playtest prototypes, and meet sound designers and pixel artists!
Apply before: Nov 18, 2026
URL: https://gamedev.example.org/noida-jam`,
  },
];

export default function CapturePage() {
  const router = useRouter();
  const { currentUser } = useUser();
  const { addToast } = useToast();

  // Workflow steps: 1: Input -> 2: Extracting -> 3: Review & Duplicates -> 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<InputMode>('poster');

  // Input states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStatusText, setExtractStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted Data & Duplicate Check
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedEventId, setPublishedEventId] = useState<string | null>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  // Run Extraction Workflow
  const handleStartExtraction = async () => {
    setErrorMessage(null);
    setStep(2);
    setExtractProgress(15);
    setExtractStatusText('Validating announcement input...');

    try {
      if (inputMode === 'url') {
        setExtractStatusText('Fetching public event URL safely (SSRF-protected)...');
        setExtractProgress(40);

        const res = await fetch('/api/capture/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput.trim() }),
        });

        setExtractProgress(75);
        setExtractStatusText('Parsing event entities and dates...');

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to extract event from URL');
        }

        setExtractProgress(100);
        setDraft(data.draft);
        setDuplicateCheck(data.duplicateCheck);
        setStep(3);
      } else {
        // Poster image or pasted text
        const formData = new FormData();
        if (inputMode === 'poster') {
          if (!selectedFile) {
            throw new Error('Please select an event flyer or poster image first.');
          }
          formData.append('file', selectedFile);
          setExtractStatusText('Running Optical Character Recognition (OCR)...');
          setExtractProgress(35);
        } else {
          if (!pastedText.trim()) {
            throw new Error('Please paste the event announcement text.');
          }
          formData.append('text', pastedText.trim());
          setExtractStatusText('Analyzing announcement syntax...');
          setExtractProgress(40);
        }

        const res = await fetch('/api/capture/ocr', {
          method: 'POST',
          body: formData,
        });

        setExtractProgress(80);
        setExtractStatusText('Checking existing database for duplicates...');

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to extract text from announcement');
        }

        setExtractProgress(100);
        setDraft(data.draft);
        setDuplicateCheck(data.duplicateCheck);
        setStep(3);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'Extraction failed');
      setStep(1);
    }
  };

  // Draft form field modification
  const updateDraftField = (field: keyof EventDraft, value: any) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [field]: value,
      uncertainFields: draft.uncertainFields.filter(f => f !== field),
      missingFields: draft.missingFields.filter(f => f !== field),
    });
  };

  // Publish / Save Draft to NearVibe
  const handlePublish = async (asDraftOnly: boolean = false) => {
    if (!draft) return;
    if (!draft.title.trim()) {
      addToast('Please provide an event title', 'error');
      return;
    }
    if (!draft.startTime) {
      addToast('Please provide a valid start date and time', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        organizerId: currentUser.id || 'demo_organizer_delhi',
        organizerName: draft.organizerName || currentUser.name || 'Community Curator',
        organizerAvatar: currentUser.avatarUrl,
        title: draft.title.trim(),
        description: draft.description || `Imported via Poster-to-Event Engine from ${draft.sourceType}.`,
        category: draft.category || 'Tech',
        tags: draft.tags.length > 0 ? draft.tags : ['community', 'discovered'],
        coverImage:
          imagePreview ||
          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        startTime: draft.startTime,
        endTime: draft.endTime,
        format: draft.format,
        venueName: draft.venueName || 'Venue TBD',
        address: draft.address || 'Delhi NCR',
        city: draft.city || 'New Delhi',
        latitude: draft.city === 'Noida' ? 28.5355 : 28.6139,
        longitude: draft.city === 'Noida' ? 77.391 : 77.209,
        isFree: draft.isFree,
        price: draft.price,
        capacity: 100,
        status: asDraftOnly ? 'draft' : 'published',
        featured: false,
        trustStatus: draft.sourceUrl ? 'source_attached' : 'needs_review',
        sourceType: draft.sourceType,
        sourceUrl: draft.sourceUrl,
        registrationDeadline: draft.registrationDeadline,
        extractionMetadata: draft.extractionMetadata,
        duplicateOfId: duplicateCheck?.isDuplicate ? duplicateCheck.matchedEvents[0]?.eventId : undefined,
        duplicateReason: duplicateCheck?.isDuplicate ? duplicateCheck.matchedEvents[0]?.matchReason : undefined,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save event');
      }

      setPublishedEventId(data.event.id);
      setStep(4);
      addToast(asDraftOnly ? 'Draft saved successfully!' : 'Event published to NearVibe!', 'success');
    } catch (err: any) {
      console.error('Publish error:', err);
      addToast(err.message || 'Failed to publish event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Poster-to-Event Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 dark:text-white tracking-tight">
          Capture an Event
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-zinc-600 dark:text-zinc-400">
          Convert scattered WhatsApp flyers, Instagram posters, and web announcements into structured, verified event listings in seconds.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 sm:gap-4 max-w-2xl w-full">
          {[
            { stepNum: 1, label: '1. Input Source' },
            { stepNum: 2, label: '2. OCR & Extract' },
            { stepNum: 3, label: '3. Review & Duplicates' },
            { stepNum: 4, label: '4. Published' },
          ].map((s, idx) => (
            <React.Fragment key={s.stepNum}>
              <div
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  step === s.stepNum
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : step > s.stepNum
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                }`}
              >
                <span>{s.label}</span>
              </div>
              {idx < 3 && <div className="h-0.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* STEP 1: INPUT SOURCE SELECTION */}
      {step === 1 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-6">
          {/* Input Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl">
            <button
              type="button"
              onClick={() => setInputMode('poster')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                inputMode === 'poster'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 text-rose-500" />
              <span>Upload Poster</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-violet-500" />
              <span>Paste Text</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                inputMode === 'url'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4 text-sky-500" />
              <span>Event Webpage</span>
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Extraction could not proceed</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* MODE A: UPLOAD POSTER */}
          {inputMode === 'poster' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center hover:border-rose-400 dark:hover:border-rose-600 transition-colors">
                <input
                  type="file"
                  id="posterUpload"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="posterUpload" className="cursor-pointer block space-y-3">
                  <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {selectedFile ? selectedFile.name : 'Click to upload flyer or drag & drop'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Supports JPEG, PNG, or WebP event posters up to 10MB
                    </p>
                  </div>
                </label>
              </div>

              {imagePreview && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                  <img
                    src={imagePreview}
                    alt="Poster Preview"
                    className="w-20 h-20 object-cover rounded-xl border"
                  />
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      Selected Flyer
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Ready for optical character extraction (OCR).
                    </p>
                  </div>
                </div>
              )}

              {/* Instant Sample Presets for Demo */}
              <div className="pt-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Or Test with Hackathon Preset (Instant OCR)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_POSTER_TEXTS.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => {
                        setInputMode('text');
                        setPastedText(sample.text);
                      }}
                      className="text-left p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-600 bg-zinc-50 dark:bg-zinc-800/40 transition-colors"
                    >
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        {sample.label}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        Click to load announcement text & test extraction
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE B: PASTED TEXT */}
          {inputMode === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Event Announcement or WhatsApp Message
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste event broadcast message, WhatsApp blast, or Instagram caption here..."
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono text-xs leading-relaxed"
                />
              </div>

              {/* Sample loader buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Load sample:</span>
                {SAMPLE_POSTER_TEXTS.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setPastedText(sample.text)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200"
                  >
                    {sample.label.split(' ')[0]} {sample.label.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MODE C: PUBLIC URL */}
          {inputMode === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Public Event Webpage URL
                </label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/events/delhi-ai-hackathon-2026"
                  className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Security & Ingestion Safeguards</span>
                </p>
                <p>
                  NearVibe restricts URL imports to public HTTPS/HTTP destinations with SSRF protection, size limits (2MB), and 5-second timeouts. Private IPs and localhost requests are strictly blocked.
                </p>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleStartExtraction}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-sm shadow-xl transition-all"
            >
              <span>Extract Event Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EXTRACTING STATE */}
      {step === 2 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Processing Event Announcement...
            </h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {extractStatusText}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-rose-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${extractProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW DRAFT & DUPLICATE CHECK */}
      {step === 3 && draft && (
        <div className="space-y-6">
          {/* Duplicate Detection Card */}
          {duplicateCheck && duplicateCheck.isDuplicate && (
            <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Possible Duplicate Detected in Database ({duplicateCheck.matchedEvents[0]?.confidenceScore}% Match)</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {duplicateCheck.matchedEvents[0]?.matchReason}
              </p>
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">
                    Existing Listing: {duplicateCheck.matchedEvents[0]?.existingTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    ID: {duplicateCheck.matchedEvents[0]?.eventId}
                  </p>
                </div>
                <Link
                  href={`/events/${duplicateCheck.matchedEvents[0]?.eventId}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                >
                  <span>Inspect Existing</span>
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                * Note: NearVibe does not automatically merge listings. You may continue to publish if this is a distinct session or edition.
              </p>
            </div>
          )}

          {/* Missing / Uncertain Fields Alert */}
          {(draft.uncertainFields.length > 0 || draft.missingFields.length > 0) && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 text-xs text-sky-800 dark:text-sky-300 flex items-start gap-3">
              <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Honest Extraction Notice</p>
                <p>
                  The OCR/parser flagged the following fields as uncertain or missing:{' '}
                  <span className="font-semibold underline">
                    {[...draft.uncertainFields, ...draft.missingFields].join(', ')}
                  </span>
                  . NearVibe does not invent information — please verify and complete them below before publishing.
                </p>
              </div>
            </div>
          )}

          {/* Editable Draft Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Review & Correct Extracted Details
                </h3>
                <p className="text-xs text-zinc-500">
                  Source: <span className="font-semibold">{draft.sourceType}</span> | Extracted at: {new Date(draft.extractionMetadata.extractedAt || Date.now()).toLocaleTimeString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold"
              >
                Change Source
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Title */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => updateDraftField('title', e.target.value)}
                  className={`w-full p-3 rounded-xl border text-sm font-bold bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    draft.uncertainFields.includes('title') ? 'border-amber-400 bg-amber-50/20' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
              </div>

              {/* Organizer Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Organizer / Host Community
                </label>
                <input
                  type="text"
                  value={draft.organizerName}
                  onChange={(e) => updateDraftField('organizerName', e.target.value)}
                  placeholder="e.g. Delhi Tech Club"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraftField('category', e.target.value as EventCategory)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Tech">Tech</option>
                  <option value="Music">Music</option>
                  <option value="Food">Food</option>
                  <option value="Art">Art</option>
                  <option value="Sports">Sports</option>
                  <option value="Community">Community</option>
                  <option value="Business">Business</option>
                </select>
              </div>

              {/* Start Date & Time */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Start Date & Time (ISO / Local) *
                </label>
                <input
                  type="text"
                  value={draft.startTime}
                  onChange={(e) => updateDraftField('startTime', e.target.value)}
                  placeholder="2026-11-14T09:00:00"
                  className={`w-full p-3 rounded-xl border text-sm font-mono bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                    draft.uncertainFields.includes('startTime') ? 'border-amber-400 bg-amber-50/20' : 'border-zinc-200 dark:border-zinc-700'
                  }`}
                />
              </div>

              {/* End Date & Time */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="text"
                  value={draft.endTime}
                  onChange={(e) => updateDraftField('endTime', e.target.value)}
                  placeholder="2026-11-14T20:00:00"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Registration Deadline */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Registration Deadline (Optional)
                </label>
                <input
                  type="text"
                  value={draft.registrationDeadline || ''}
                  onChange={(e) => updateDraftField('registrationDeadline', e.target.value)}
                  placeholder="2026-11-10T23:59:00"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-mono bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Format
                </label>
                <select
                  value={draft.format}
                  onChange={(e) => updateDraftField('format', e.target.value as EventFormat)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="in-person">In-Person</option>
                  <option value="online">Online / Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Venue Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={draft.venueName}
                  onChange={(e) => updateDraftField('venueName', e.target.value)}
                  placeholder="e.g. IIT Delhi Research Park"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  City / Locality
                </label>
                <select
                  value={draft.city}
                  onChange={(e) => updateDraftField('city', e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="New Delhi">New Delhi</option>
                  <option value="South Delhi">South Delhi</option>
                  <option value="Noida">Noida</option>
                  <option value="Gurugram">Gurugram</option>
                </select>
              </div>

              {/* Pricing */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ticket Pricing
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={draft.isFree}
                      onChange={(e) => {
                        updateDraftField('isFree', e.target.checked);
                        if (e.target.checked) updateDraftField('price', 0);
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Free Admission</span>
                  </label>
                  {!draft.isFree && (
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(e) => updateDraftField('price', parseFloat(e.target.value) || 0)}
                      placeholder="Price in ₹"
                      className="w-32 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800"
                    />
                  )}
                </div>
              </div>

              {/* Registration Link / Source URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Source Reference / Registration Link
                </label>
                <input
                  type="url"
                  value={draft.sourceUrl || ''}
                  onChange={(e) => updateDraftField('sourceUrl', e.target.value)}
                  placeholder="https://official-event-page.com"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Description
                </label>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => updateDraftField('description', e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Submission Actions */}
            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handlePublish(true)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Save as Draft Only
              </button>

              <button
                type="button"
                onClick={() => handlePublish(false)}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02]"
              >
                <span>{isSubmitting ? 'Publishing...' : 'Publish to NearVibe'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS PUBLISHED */}
      {step === 4 && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-6 max-w-xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Event Ingested Successfully!
            </h2>
            <p className="text-xs text-zinc-500">
              The announcement has been transformed into a searchable listing, indexed in discovery with honest trust metadata.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            {publishedEventId && (
              <Link
                href={`/events/${publishedEventId}`}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-600/30 hover:bg-rose-500 transition-all"
              >
                <span>View Event Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setDraft(null);
                setDuplicateCheck(null);
                setSelectedFile(null);
                setImagePreview(null);
                setPastedText('');
                setUrlInput('');
              }}
              className="px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
            >
              Capture Another Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
