'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  PlusCircle,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Edit,
  Trash2,
  ExternalLink,
  AlertCircle,
  Radio,
  Eye,
} from 'lucide-react';
import { EventItem } from '@/types';
import { OrganizerStats } from '@/lib/repository/types';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';
import ConfirmModal from '@/components/ConfirmModal';
import { formatEventDateTime } from '@/lib/utils/date';

export default function OrganizerDashboardPage() {
  const { currentUser, switchIdentity, isOrganizer } = useUser();
  const { addToast } = useToast();

  const [stats, setStats] = useState<OrganizerStats>({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    averageAttendance: 0,
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal
  const [cancellingEventId, setCancellingEventId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrganizerData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/organizer/stats?organizerId=${currentUser.id}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setEvents(data.events || []);
        }
      } catch (err) {
        console.warn('Failed to load organizer data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizerData();
  }, [currentUser.id]);

  const handleCancelEvent = async () => {
    if (!cancellingEventId) return;

    try {
      const res = await fetch(`/api/events/${cancellingEventId}?organizerId=${currentUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        addToast('Event cancelled successfully', 'info');
        setEvents((prev) =>
          prev.map((e) => (e.id === cancellingEventId ? { ...e, status: 'cancelled' } : e))
        );
      } else {
        addToast(data.error || 'Failed to cancel event', 'error');
      }
    } catch {
      addToast('Error communicating with server', 'error');
    } finally {
      setCancellingEventId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      
      {/* Top Banner / Switch to Organizer if attendee */}
      {!isOrganizer && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                You are currently viewing as Attendee ({currentUser.name})
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Switch to Organizer persona to view published events and metrics for TechHub NCR.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchIdentity('organizer')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-sm shrink-0"
          >
            Switch to TechHub NCR (Organizer)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Organizer Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
              Community Hub
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your published events, monitor attendee registrations, and analyze reach in Delhi NCR.
          </p>
        </div>

        <Link
          href="/organizer/events/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish New Event</span>
        </Link>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <Layers className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.totalEvents}
          </p>
          <p className="text-[11px] text-zinc-400">Published across NCR hubs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registrations</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.totalRegistrations}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Active attendees confirmed
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.upcomingEvents}
          </p>
          <p className="text-[11px] text-zinc-400">Scheduled in next 30 days</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Capacity Fill</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
            {stats.averageAttendance}%
          </p>
          <p className="text-[11px] text-zinc-400">High community demand</p>
        </div>
      </div>

      {/* Events Table / List */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Your Managed Events
          </h2>
          <span className="text-xs text-zinc-500">{events.length} listings</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-zinc-400 animate-pulse">
            Loading organizer events...
          </div>
        ) : events.length > 0 ? (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {events.map((evt) => {
              const fillPct =
                evt.capacity > 0
                  ? Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100))
                  : 0;

              return (
                <div
                  key={evt.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Event Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
                    />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {evt.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {evt.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                        {evt.title}
                      </h3>

                      <p className="text-xs text-zinc-500">
                        📍 {evt.venueName}, {evt.city} • 📅 {formatEventDateTime(evt.startTime)}
                      </p>
                    </div>
                  </div>

                  {/* Registrations & Capacity Fill Meter */}
                  <div className="w-full md:w-48 space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Registrations</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {evt.registeredCount} / {evt.capacity}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 text-right">
                      {fillPct}% Capacity Booked
                    </p>
                  </div>

                  {/* Actions: View, Edit, Cancel */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Link
                      href={`/events/${evt.id}`}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                      title="View Event Public Page"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/organizer/events/${evt.id}/edit`}
                      className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                      title="Edit Event Details"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>

                    {evt.status === 'published' && (
                      <button
                        onClick={() => setCancellingEventId(evt.id)}
                        className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors"
                        title="Cancel Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Layers className="w-10 h-10 text-zinc-400 mx-auto" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
              No Events Published
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Publish your first hackathon or workshop to reach thousands of attendees across NCR.
            </p>
            <div className="pt-2">
              <Link
                href="/organizer/events/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create First Event</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Event Cancellation Dialog */}
      <ConfirmModal
        isOpen={Boolean(cancellingEventId)}
        title="Cancel This Event?"
        message="Are you sure you want to cancel this event? Existing registered attendees will be notified and new registrations will be permanently halted."
        confirmText="Yes, Cancel Event"
        cancelText="Keep Event Active"
        isDestructive={true}
        onConfirm={handleCancelEvent}
        onCancel={() => setCancellingEventId(null)}
      />

    </div>
  );
}
