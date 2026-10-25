'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Trash2,
  CalendarPlus,
  Compass,
  Car,
  DollarSign,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
  ShieldCheck,
} from 'lucide-react';
import { WeekendItinerary, ScheduledEventItem, WeekendGoal, PlannerPreferences, EventItem } from '@/types';
import { formatEventDateOnly, formatEventTimeOnly } from '@/lib/utils/date';
import { downloadEventICS, getGoogleCalendarUrl } from '@/lib/utils/calendar';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

const WEEKEND_GOALS: { id: WeekendGoal; label: string; desc: string; icon: string }[] = [
  { id: 'Learn a Skill', label: 'Learn a Skill', desc: 'Workshops, masterclasses, and coding sprints', icon: '🧠' },
  { id: 'Win Hackathons', label: 'Win Hackathons', desc: 'Competitive builds & collegiate hackathons', icon: '🏆' },
  { id: 'Startup Networking', label: 'Startup Networking', desc: 'Mixers with founders, angels, and creators', icon: '🤝' },
  { id: 'Creative & Arts', label: 'Creative & Arts', desc: 'Design showcases, indie game jams & music', icon: '🎨' },
  { id: 'Budget Friendly', label: 'Free & Budget Friendly', desc: 'Zero entry fee or under ₹250 events', icon: '💸' },
  { id: 'All-Rounder', label: 'Curated Mix', desc: 'Top trending community events in Delhi NCR', icon: '✨' },
];

export default function PlannerPage() {
  const { selectedCity, userCoordinates } = useUser();
  const { addToast } = useToast();

  // Preferences
  const [selectedGoal, setSelectedGoal] = useState<WeekendGoal>('Learn a Skill');
  const [dateWindow, setDateWindow] = useState<'this_weekend' | 'saturday' | 'sunday'>('this_weekend');
  const [timeWindow, setTimeWindow] = useState<'all_day' | 'morning' | 'afternoon' | 'evening'>('all_day');
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined);
  const [formatPreference, setFormatPreference] = useState<'all' | 'in-person' | 'online'>('all');
  const [maxEvents, setMaxEvents] = useState<number>(3);

  // Itinerary state
  const [itinerary, setItinerary] = useState<WeekendItinerary | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate Itinerary
  const handleGenerateItinerary = async () => {
    setLoading(true);
    try {
      const payload: PlannerPreferences = {
        goal: selectedGoal,
        dateWindow,
        timeWindow,
        maxBudget,
        formatPreference,
        maxEvents,
      };

      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.itinerary) {
        setItinerary(data.itinerary);
        addToast('Smart weekend schedule generated!', 'success');
      } else {
        throw new Error(data.error || 'Failed to generate itinerary');
      }
    } catch (err: any) {
      console.error('Planner error:', err);
      addToast(err.message || 'Could not build itinerary', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run on first load
  useEffect(() => {
    handleGenerateItinerary();
  }, []);

  // Remove event from schedule & recompute
  const handleRemoveEvent = (eventId: string) => {
    if (!itinerary) return;
    const remainingSchedule = itinerary.schedule.filter((s) => s.event.id !== eventId);
    const newTotalCost = remainingSchedule.reduce(
      (sum, s) => sum + (s.event.isFree ? 0 : s.event.price),
      0
    );

    setItinerary({
      ...itinerary,
      schedule: remainingSchedule,
      totalEstimatedCost: newTotalCost,
      warnings: remainingSchedule.length === 0 ? ['All events removed from itinerary.'] : itinerary.warnings,
    });
    addToast('Event removed from your itinerary', 'info');
  };

  // Export full weekend itinerary to calendar
  const handleExportFullCalendar = () => {
    if (!itinerary || itinerary.schedule.length === 0) return;
    // Download first or open google cal
    downloadEventICS(itinerary.schedule[0].event);
    addToast('Downloaded itinerary event (.ics)', 'success');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-900">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Non-Overlapping Schedule Optimizer</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-950 dark:text-white tracking-tight">
          Plan My Weekend
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-zinc-600 dark:text-zinc-400">
          Tell NearVibe what you want to achieve. We calculate an optimal, collision-free itinerary with transit buffers between Delhi NCR venues.
        </p>
      </div>

      {/* Preferences Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            1. What is your primary weekend goal?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {WEEKEND_GOALS.map((g) => {
              const active = selectedGoal === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGoal(g.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                    active
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-300 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{g.icon}</span>
                  <span className="text-xs font-bold leading-tight">{g.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* Date Window */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Date Window
            </label>
            <select
              value={dateWindow}
              onChange={(e) => setDateWindow(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="this_weekend">Entire Weekend (Sat & Sun)</option>
              <option value="saturday">Saturday Only</option>
              <option value="sunday">Sunday Only</option>
            </select>
          </div>

          {/* Time of Day */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Time Preference
            </label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="all_day">Flexible (All Day)</option>
              <option value="morning">Mornings (Before 1 PM)</option>
              <option value="afternoon">Afternoons (12 PM - 6 PM)</option>
              <option value="evening">Evenings (5 PM+)</option>
            </select>
          </div>

          {/* Format Preference */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Event Format
            </label>
            <select
              value={formatPreference}
              onChange={(e) => setFormatPreference(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="all">All Formats</option>
              <option value="in-person">In-Person Only</option>
              <option value="online">Virtual / Online</option>
            </select>
          </div>

          {/* Budget Limit */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Budget Cap
            </label>
            <select
              value={maxBudget === undefined ? 'any' : maxBudget}
              onChange={(e) =>
                setMaxBudget(e.target.value === 'any' ? undefined : parseInt(e.target.value, 10))
              }
              className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="any">Any Budget</option>
              <option value="0">100% Free Events</option>
              <option value="300">Under ₹300</option>
              <option value="1000">Under ₹1,000</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleGenerateItinerary}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs shadow-xl transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Optimizing Schedule...' : 'Generate Weekend Itinerary'}</span>
          </button>
        </div>
      </div>

      {/* ITINERARY RESULTS */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-3 border-rose-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Checking venue coordinates and eliminating overlaps...</p>
        </div>
      ) : !itinerary || itinerary.schedule.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-4">
          <Compass className="w-12 h-12 text-zinc-400 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            No Collision-Free Itinerary Found for These Exact Filters
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Try broadening your budget, selecting &quot;Entire Weekend&quot;, or choosing &quot;All Formats&quot; to discover more compatible events.
          </p>
          <button
            onClick={() => {
              setMaxBudget(undefined);
              setDateWindow('this_weekend');
              setTimeWindow('all_day');
              handleGenerateItinerary();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
          >
            Reset Filters & Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Itinerary Summary Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Itinerary Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Zero Conflicts</span>
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Events Scheduled</span>
              <span className="text-base font-black text-zinc-900 dark:text-white">
                {itinerary.schedule.length} Experiences
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-zinc-400 block">Total Est. Cost</span>
              <span className="text-base font-black text-zinc-900 dark:text-white">
                {itinerary.totalEstimatedCost === 0 ? 'FREE' : `₹${itinerary.totalEstimatedCost}`}
              </span>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handleExportFullCalendar}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100"
              >
                <CalendarPlus className="w-3.5 h-3.5 text-rose-500" />
                <span>Export Calendar</span>
              </button>
            </div>
          </div>

          {/* Warnings box if any */}
          {itinerary.warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Schedule Insights</span>
              </p>
              {itinerary.warnings.map((w, idx) => (
                <p key={idx}>• {w}</p>
              ))}
            </div>
          )}

          {/* Timeline Sequence */}
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-rose-200 dark:before:bg-rose-950">
            {itinerary.schedule.map((item, idx) => {
              const slotIndex = item.slotIndex ?? idx + 1;
              const timeSlotLabel = item.timeSlotLabel ?? `${formatEventTimeOnly(item.event.startTime)} - ${formatEventTimeOnly(item.event.endTime)}`;
              const { event, selectionReason, transitFromPrevious } = item;

              return (
                <React.Fragment key={event.id}>
                  {/* Transit Buffer between stops */}
                  {transitFromPrevious && (
                    <div className="relative flex items-center gap-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400">
                      <Car className="w-4 h-4 text-rose-500 shrink-0" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {transitFromPrevious.estimatedMinutes} min estimated transit
                        </span>{' '}
                        via Metro / Cab ({transitFromPrevious.distanceKm.toFixed(1)} km between venues)
                      </div>
                    </div>
                  )}

                  {/* Scheduled Stop Card */}
                  <div className="relative group rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm hover:shadow-xl transition-all space-y-4">
                    {/* Time Slot Node Marker */}
                    <div className="absolute -left-9 sm:-left-11 top-6 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black shadow-md shadow-rose-600/30">
                      {slotIndex}
                    </div>

                    {/* Top Row: Time & Category */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                          {timeSlotLabel}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {formatEventDateOnly(event.startTime)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveEvent(event.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Remove from itinerary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Event Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                      <div className="sm:col-span-3 space-y-2">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-extrabold text-lg text-zinc-950 dark:text-white hover:text-rose-600 transition-colors line-clamp-1"
                        >
                          {event.title}
                        </Link>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                            {event.venueName}, {event.city}
                          </span>

                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {event.isFree ? 'Free Admission' : `₹${event.price}`}
                          </span>
                        </div>

                        {/* Selection Reason */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          <Sparkles className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{selectionReason}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <Link
                          href={`/events/${event.id}`}
                          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs"
                        >
                          <span>Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
