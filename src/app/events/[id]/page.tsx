'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Users,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Flag,
  CalendarPlus,
  Sparkles,
  UserPlus,
  AlertTriangle,
  Info,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Radio,
  Globe,
  Send,
} from 'lucide-react';
import { EventItem, EventComment, SquadTeam } from '@/types';
import { formatEventDateTime, formatEventDateOnly, formatEventTimeOnly } from '@/lib/utils/date';
import { formatDistance } from '@/lib/utils/geo';
import { downloadEventICS, getGoogleCalendarUrl } from '@/lib/utils/calendar';
import { evaluateEventTrust } from '@/lib/utils/trust';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import ShareModal from '@/components/ShareModal';
import ReportModal from '@/components/ReportModal';
import confetti from 'canvas-confetti';

function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { currentUser, isEventSaved, toggleSave, isEventRegistered, registerForEvent, cancelRegistration } = useUser();
  const { addToast } = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [eventSquads, setEventSquads] = useState<SquadTeam[]>([]);
  const [comments, setComments] = useState<EventComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    async function fetchEventDetails() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${id}?userId=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.event) {
          setEvent(data.event);
        }

        // Fetch event-specific squads
        try {
          const sRes = await fetch(`/api/squad/teams?eventId=${id}`);
          const sData = await sRes.json();
          if (sData.success && sData.teams) {
            setEventSquads(sData.teams);
          }
        } catch {}

        // Fetch comments
        const cRes = await fetch(`/api/events/${id}/comments`);
        const cData = await cRes.json();
        if (cData.success && cData.comments) {
          setComments(cData.comments);
        }
      } catch (err) {
        console.warn('Failed to load event details:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchEventDetails();
    }
  }, [id, currentUser.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-rose-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
          Event Not Found
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          The event you requested may have been removed, cancelled, or the link might be expired.
        </p>
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Explore Other Events</span>
        </Link>
      </div>
    );
  }

  const registered = isEventRegistered(event.id) || event.isRegistered;
  const saved = isEventSaved(event.id) || event.isSaved;
  const trust = evaluateEventTrust(event);
  const isSoldOut = event.capacity > 0 && event.registeredCount >= event.capacity;
  const fillPercentage =
    event.capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))
      : 0;

  const googleMapsUrl = event.latitude && event.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venueName}, ${event.address}, ${event.city}`)}`;

  const handleRegister = async () => {
    if (registered || isSoldOut || isActionLoading || !trust.canRegister) return;
    setIsActionLoading(true);
    const result = await registerForEvent(event.id);
    setIsActionLoading(false);

    if (result.success) {
      setEvent((prev) => (prev ? { ...prev, registeredCount: prev.registeredCount + 1, isRegistered: true } : null));
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF4B4B', '#8B5CF6', '#10B981'],
        });
      } catch {}
    }
  };

  const handleConfirmCancel = async () => {
    setIsActionLoading(true);
    await cancelRegistration(event.id);
    setIsActionLoading(false);
    setShowCancelModal(false);
    setEvent((prev) => (prev ? { ...prev, registeredCount: Math.max(0, prev.registeredCount - 1), isRegistered: false } : null));
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/events/${event.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatarUrl,
          text: newComment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        addToast('Comment published to discussion', 'success');
      } else {
        addToast(data.error || 'Failed to post comment', 'error');
      }
    } catch {
      addToast('Failed to connect to discussion server', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
      
      {/* Back button & top meta */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50"
          >
            <Share2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Share</span>
          </button>

          <button
            onClick={() => toggleSave(event.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors text-xs font-semibold ${
              saved
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Details (Left) + Registration Action Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Image, Title, Description, Venue Map, Q&A */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Cover Banner */}
          <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-zinc-900 shadow-lg border border-zinc-200/80 dark:border-zinc-800">
            <img
              src={event.coverImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow">
                  {event.category}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md">
                  {event.format === 'online' ? 'Virtual Stage' : event.format === 'hybrid' ? 'Hybrid Stage' : 'In-Person Venue'}
                </span>
              </div>

              {event.isFree ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow">
                  FREE ADMISSION
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-zinc-900 shadow">
                  ₹{event.price} / Ticket
                </span>
              )}
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Organizer bar & Trust Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                  {event.organizerAvatar ? (
                    <img
                      src={event.organizerAvatar}
                      alt={event.organizerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-full h-full p-2 text-zinc-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Organized by
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {event.organizerName}
                  </p>
                </div>
              </div>

              {/* Honest Trust Badge */}
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border self-start sm:self-center ${trust.badgeColorClass}`}>
                {trust.status === 'organizer_verified' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : trust.status === 'deadline_passed' || trust.status === 'event_ended' ? (
                  <Clock className="w-4 h-4" />
                ) : trust.status === 'possible_duplicate' || trust.status === 'needs_review' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Info className="w-4 h-4" />
                )}
                <span>{trust.badgeLabel}</span>
              </div>
            </div>

            {/* Trust & Source Transparency Box */}
            <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-rose-500" />
                  <span>Trust & Reliability Transparency</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  NearVibe Trust Score
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {trust.explanation}
              </p>
              {event.sourceUrl && (
                <div className="pt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span>Source Reference:</span>
                  <a
                    href={event.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 truncate max-w-xs sm:max-w-md"
                  >
                    <span>{event.sourceUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {event.registrationDeadline && (
                <p className="text-[11px] text-zinc-400">
                  Registration Cutoff: {new Date(event.registrationDeadline).toLocaleString()}
                </p>
              )}
            </div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              About This Event
            </h2>
            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
              {event.description}
            </div>
          </div>

          {/* Venue & Map directions */}
          <div className="space-y-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Location & Venue
              </h2>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {event.venueName}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  {event.address}, {event.city}
                </p>
                {event.distanceKm !== undefined && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1">
                    {formatDistance(event.distanceKm)} from your selected location
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SquadUp Teammate Formation Section */}
          <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-rose-500" />
                  <span>SquadUp: Teammate Matching</span>
                </h2>
                <p className="text-xs text-zinc-500">
                  Form a team for this event or find open roles with other attendees.
                </p>
              </div>
              <Link
                href="/squadup"
                className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                <span>SquadUp Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {eventSquads.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                <p className="text-xs text-zinc-500">
                  No squad teams recruiting for this event yet. Be the first to start a squad!
                </p>
                <Link
                  href="/squadup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-sm hover:bg-rose-500"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Squad for this Event</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {eventSquads.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{team.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {team.currentMembers}/{team.maxMembers} Members
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 line-clamp-2">{team.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {team.requiredRoles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-900"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                    <div className="pt-1 flex justify-end">
                      <Link
                        href="/squadup"
                        className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <span>Join via SquadUp</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Community Discussion / Q&A */}
          <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Community Discussion & Q&A ({comments.length})
              </h2>
            </div>

            {/* Post comment input */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Ask a question as ${currentUser.name}...`}
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingComment ? 'Posting...' : 'Post Question'}</span>
                </button>
              </div>
            </form>

            {/* Comments list */}
            {comments.length > 0 ? (
              <div className="space-y-3 pt-2">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden shrink-0">
                          {c.authorAvatar ? (
                            <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-full h-full p-1 text-zinc-500" />
                          )}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {c.authorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 pl-8 leading-relaxed">
                      {c.commentText}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 text-center py-4">
                No questions yet. Be the first to start the discussion!
              </p>
            )}
          </div>

          {/* Report Event Link */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-500 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report this listing</span>
            </button>
          </div>

        </div>

        {/* Right Column: Sticky Registration & Calendar Card */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 space-y-5">
            
            {/* Price display */}
            <div className="flex items-baseline justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <span className="text-xs text-zinc-500 font-medium">Ticket Price</span>
              <div>
                {event.isFree ? (
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    FREE
                  </span>
                ) : (
                  <span className="text-2xl font-black text-zinc-900 dark:text-white">
                    ₹{event.price}
                  </span>
                )}
              </div>
            </div>

            {/* Date and Time Box */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                <Calendar className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    {formatEventDateOnly(event.startTime)}
                  </p>
                  <p className="text-zinc-500">
                    {formatEventTimeOnly(event.startTime)} - {formatEventTimeOnly(event.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300 pt-1">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">
                    {event.venueName}
                  </p>
                  <p className="text-zinc-500 truncate max-w-[200px]">
                    {event.address}, {event.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-500">Registration Status</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {event.registeredCount} / {event.capacity} Filled
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    fillPercentage >= 90
                      ? 'bg-rose-500'
                      : fillPercentage >= 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-400 text-right">
                {isSoldOut ? 'Event at full capacity' : `${event.capacity - event.registeredCount} spots remaining`}
              </p>
            </div>

            {/* Primary Action Button (Register or Cancel) */}
            <div className="pt-2">
              {registered ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-4 h-4" />
                    <span>You are registered for this event!</span>
                  </div>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isActionLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    Cancel Registration
                  </button>
                </div>
              ) : !trust.canRegister ? (
                <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-center space-y-1">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {trust.badgeLabel}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    {trust.explanation}
                  </p>
                </div>
              ) : isSoldOut ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                >
                  Sold Out / Full Capacity
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isActionLoading}
                  className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
                >
                  {isActionLoading ? 'Securing Spot...' : 'Register Now (Free Entry)'}
                </button>
              )}
            </div>

            {/* Add to Calendar Section */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Add to Calendar
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadEventICS(event)}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <CalendarPlus className="w-3.5 h-3.5 text-rose-500" />
                  <span>Download .ICS</span>
                </button>

                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-violet-500" />
                  <span>Google Cal</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Modal for Registration Cancellation */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Your Registration?"
        message={`Are you sure you want to cancel your spot for "${event.title}"? Your spot will be released immediately to another attendee.`}
        confirmText="Yes, Cancel Registration"
        cancelText="Keep My Spot"
        isDestructive={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        event={event}
        onClose={() => setShowShareModal(false)}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        eventId={event.id}
        eventTitle={event.title}
        onClose={() => setShowReportModal(false)}
      />

    </div>
  );
}

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 rounded-full border-3 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading event details...</p>
        </div>
      }
    >
      <EventDetailContent {...props} />
    </React.Suspense>
  );
}
