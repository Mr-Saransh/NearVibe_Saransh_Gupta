'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Calendar, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';
import { EventItem, Registration } from '@/types';
import EventCard from '@/components/EventCard';
import { useUser } from '@/lib/context/UserContext';

export default function SavedEventsPage() {
  const { currentUser, savedEventIds, registeredEventIds } = useUser();
  const [activeTab, setActiveTab] = useState<'saved' | 'registered'>('saved');
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavedData() {
      setLoading(true);
      try {
        // Fetch saved events
        const savedRes = await fetch(`/api/saved?userId=${currentUser.id}`);
        const savedData = await savedRes.json();
        if (savedData.success && savedData.events) {
          setSavedEvents(savedData.events);
        }

        // Fetch registered events
        const regRes = await fetch(`/api/registrations?userId=${currentUser.id}`);
        const regData = await regRes.json();
        if (regData.success && regData.registrations) {
          setRegistrations(regData.registrations);
        }
      } catch (err) {
        console.warn('Failed to load user saved/registered events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedData();
  }, [currentUser.id, savedEventIds.length, registeredEventIds.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            My Event Activity
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Access your saved bookmarks and confirmed event registrations
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 self-start">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'saved'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Bookmarks ({savedEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('registered')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'registered'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My Registrations ({registrations.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : activeTab === 'saved' ? (
        savedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <EmptySavedState
            title="No Saved Events Yet"
            description="You haven't bookmarked any events. Explore hackathons, workshops, and meetups happening in Delhi NCR and bookmark them to attend later."
          />
        )
      ) : registrations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  Confirmed Registration
                </span>
                <span className="text-[10px] text-zinc-400">
                  Registered: {new Date(reg.createdAt).toLocaleDateString()}
                </span>
              </div>

              {reg.event && (
                <>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white line-clamp-2">
                    {reg.event.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    📍 {reg.event.venueName}, {reg.event.city}
                  </p>
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    📅 {new Date(reg.event.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}

              <div className="pt-3 mt-auto border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <Link
                  href={`/events/${reg.eventId}`}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptySavedState
          title="No Active Registrations"
          description="You haven't registered for any events yet. Find an upcoming event that matches your interests and claim your spot!"
        />
      )}

    </div>
  );
}

function EmptySavedState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4 max-w-lg mx-auto">
      <Compass className="w-12 h-12 text-zinc-400 mx-auto" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
      <div className="pt-2">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30"
        >
          <span>Discover Local Events</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
