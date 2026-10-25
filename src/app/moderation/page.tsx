'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Flag, CheckCircle, XCircle, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';
import { EventReport } from '@/types';
import { useToast } from '@/lib/context/ToastContext';

export default function ModerationPage() {
  const { addToast } = useToast();
  const [reports, setReports] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch('/api/reports');
        const data = await res.json();
        if (data.success && data.reports) {
          setReports(data.reports);
        }
      } catch (err) {
        console.warn('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
        addToast(`Report marked as ${status}`, 'info');
      }
    } catch {
      addToast('Status updated locally', 'info');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>

      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-rose-500" />
            <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
              Community Moderation Desk
            </h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Review reported listings to maintain event accuracy and attendee safety.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
          {reports.length} Reports Logged
        </span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 animate-pulse">
          Loading moderation records...
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 uppercase">
                    {report.reason}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      report.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : report.status === 'reviewed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    Status: {report.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  Event: {report.eventTitle || report.eventId}
                </p>

                {report.details && (
                  <p className="text-xs text-zinc-500 italic">
                    &quot;{report.details}&quot;
                  </p>
                )}

                <p className="text-[10px] text-zinc-400">
                  Reporter: {report.reporterId} • Logged:{' '}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/events/${report.eventId}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>

                {report.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'reviewed')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            Moderation Queue Clear
          </h3>
          <p className="text-xs text-zinc-500">
            No active reports requiring community moderation at this time.
          </p>
        </div>
      )}
    </div>
  );
}
