'use client';

import React, { useState } from 'react';
import { Share2, X, Copy, Check, MessageSquare, Send, Globe } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { EventItem } from '@/types';

interface ShareModalProps {
  isOpen: boolean;
  event: EventItem;
  onClose: () => void;
}

export default function ShareModal({ isOpen, event, onClose }: ShareModalProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = typeof window !== 'undefined' ? window.location.href : `https://nearvibe.local/events/${event.id}`;
  const shareText = `Check out "${event.title}" on NearVibe: ${event.venueName}, ${event.city}`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('Event link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: shareText,
          url,
        });
        addToast('Shared successfully!', 'success');
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 text-zinc-900 dark:text-zinc-100">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Share2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-white">
              Share Event
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 mb-4">
          Spread the word to your campus, WhatsApp groups, or developer network!
        </p>

        {/* Share buttons grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px] font-semibold">WhatsApp</span>
          </a>

          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-sky-500 transition-colors"
          >
            <Send className="w-5 h-5" />
            <span className="text-[11px] font-semibold">X (Twitter)</span>
          </a>

          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-600 transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span className="text-[11px] font-semibold">LinkedIn</span>
          </a>
        </div>

        {/* Copy Link field */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
          <input
            type="text"
            readOnly
            value={url}
            className="flex-1 bg-transparent px-2 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 shrink-0 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
