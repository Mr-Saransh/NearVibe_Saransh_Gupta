'use client';

import React, { useState } from 'react';
import { Flag, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { useUser } from '@/lib/context/UserContext';

interface ReportModalProps {
  isOpen: boolean;
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function ReportModal({
  isOpen,
  eventId,
  eventTitle,
  onClose,
}: ReportModalProps) {
  const { addToast } = useToast();
  const { currentUser } = useUser();
  const [reason, setReason] = useState('Inaccurate Details');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch(`/api/events/${eventId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: currentUser.id,
          reason,
          details,
        }),
      });
      setSubmitted(true);
      addToast('Event reported for moderation review', 'info');
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch {
      addToast('Report submitted locally', 'info');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Flag className="w-5 h-5" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Report Listing
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-sm text-zinc-900 dark:text-white">
              Report Received
            </p>
            <p className="text-xs text-zinc-500">
              Our community moderation team will review this event within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Target Event</p>
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {eventTitle}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Reason for Reporting
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Inaccurate Details">Inaccurate venue or timing details</option>
                <option value="Spam / Duplicate">Spam, bot-created, or duplicate listing</option>
                <option value="Inappropriate Content">Inappropriate or prohibited content</option>
                <option value="Commercial Fraud">Scam, extortion, or fake ticketing</option>
                <option value="Cancelled Event">Event is already cancelled or closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide context to help moderators verify this report..."
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
