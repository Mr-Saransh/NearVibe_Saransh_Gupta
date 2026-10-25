'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import EventForm from '@/components/EventForm';
import { EventItem } from '@/types';
import { useUser } from '@/lib/context/UserContext';

function EditEventContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentUser } = useUser();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchEventToEdit() {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${id}?userId=${currentUser.id}`);
        const data = await res.json();
        if (data.success && data.event) {
          // Ownership verification
          if (data.event.organizerId !== currentUser.id && currentUser.id !== 'admin') {
            setUnauthorized(true);
          } else {
            setEvent(data.event);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch event for edit:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchEventToEdit();
    }
  }, [id, currentUser.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500">Loading event data...</p>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Unauthorized Access
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          You are currently signed in as {currentUser.name}. You can only edit events created by your own account. Switch to the organizer persona to modify this listing.
        </p>
        <Link
          href="/organizer"
          className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Event Not Found
        </h2>
        <Link
          href="/organizer"
          className="inline-flex px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
      <Link
        href="/organizer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Organizer Dashboard</span>
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Edit Event Listing
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Update event details, timing, venue, or ticketing rules.
        </p>
      </div>

      <EventForm initialData={event} isEditing={true} />
    </div>
  );
}

export default function EditEventPage(props: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <p className="text-xs text-zinc-500">Loading event data...</p>
        </div>
      }
    >
      <EditEventContent {...props} />
    </React.Suspense>
  );
}
