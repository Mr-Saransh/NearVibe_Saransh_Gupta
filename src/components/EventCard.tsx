'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Bookmark,
  Users,
  Sparkles,
  ArrowRight,
  Globe,
  Radio,
  CheckCircle,
} from 'lucide-react';
import { EventItem } from '@/types';
import { formatEventDateTime } from '@/lib/utils/date';
import { formatDistance } from '@/lib/utils/geo';
import { useUser } from '@/lib/context/UserContext';
import confetti from 'canvas-confetti';

interface EventCardProps {
  event: EventItem;
  priority?: boolean;
}

export default function EventCard({ event }: EventCardProps) {
  const { isEventSaved, toggleSave, isEventRegistered, registerForEvent } = useUser();
  const [imgError, setImgError] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const saved = isEventSaved(event.id) || event.isSaved;
  const registered = isEventRegistered(event.id) || event.isRegistered;

  const fallbackImage =
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';

  const fillPercentage =
    event.capacity > 0
      ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100))
      : 0;

  const isSoldOut = event.capacity > 0 && event.registeredCount >= event.capacity;

  const handleRegisterClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (registered || isSoldOut || isRegistering) return;

    setIsRegistering(true);
    const result = await registerForEvent(event.id);
    setIsRegistering(false);

    if (result.success) {
      // Trigger joyful celebration confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#FF4B4B', '#8B5CF6', '#10B981'],
        });
      } catch (err) {
        // Safe fallback if canvas not available
      }
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(event.id);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/90 shadow-sm hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 overflow-hidden">
      
      {/* Cover Image Container */}
      <Link href={`/events/${event.id}`} className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={imgError ? fallbackImage : event.coverImage || fallbackImage}
          alt={event.title}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {/* Category Tag */}
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-zinc-900 dark:text-white shadow-sm">
            {event.category}
          </span>

          {/* Bookmark Button */}
          <button
            onClick={handleSaveClick}
            aria-label={saved ? 'Remove from saved' : 'Save event'}
            className={`p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
              saved
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Format & Distance Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm">
            {event.format === 'online' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Virtual Event</span>
              </>
            ) : event.format === 'hybrid' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hybrid Stage</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>In-Person</span>
              </>
            )}
          </div>

          {/* Proximity badge if available */}
          {event.distanceKm !== undefined && event.format !== 'online' && (
            <span className="px-2 py-0.5 rounded-md bg-rose-600/90 text-[11px] font-bold backdrop-blur-sm">
              {formatDistance(event.distanceKm)}
            </span>
          )}
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        
        {/* Recommendation Reason Badge (if applicable) */}
        {event.recommendationReason && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-100 dark:border-rose-900/50">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{event.recommendationReason}</span>
          </div>
        )}

        {/* Date and Time */}
        <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{formatEventDateTime(event.startTime)}</span>
        </div>

        {/* Title */}
        <Link href={`/events/${event.id}`} className="group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
          <h3 className="font-bold text-base text-zinc-900 dark:text-white line-clamp-2 leading-snug">
            {event.title}
          </h3>
        </Link>

        {/* Venue & Locality */}
        <div className="flex items-start gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
          <span className="truncate">
            {event.venueName}, {event.city}
          </span>
        </div>

        {/* Capacity & Attendance Bar */}
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-zinc-400" />
              <span>{event.registeredCount} joined</span>
            </span>
            <span>
              {isSoldOut ? (
                <span className="font-bold text-rose-500">Sold Out</span>
              ) : (
                `${event.capacity - event.registeredCount} spots left`
              )}
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
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
        </div>

        {/* Footer info: Organizer & Action */}
        <div className="pt-3 mt-auto border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          
          {/* Price Tag */}
          <div>
            {event.isFree ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                FREE
              </span>
            ) : (
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                ₹{event.price}
              </span>
            )}
          </div>

          {/* Registration / Details CTA */}
          <div className="flex items-center gap-2">
            {registered ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Registered</span>
              </span>
            ) : (
              <button
                onClick={handleRegisterClick}
                disabled={isSoldOut || isRegistering}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSoldOut
                    ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed dark:bg-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 shadow-sm'
                }`}
              >
                <span>{isRegistering ? 'Registering...' : isSoldOut ? 'Full' : 'Join'}</span>
                {!isSoldOut && <ArrowRight className="w-3 h-3" />}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
