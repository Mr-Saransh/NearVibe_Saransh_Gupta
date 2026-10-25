'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import EventForm from '@/components/EventForm';

export default function NewEventPage() {
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
          Publish a New Event
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Reach thousands of developers, students, and community members across Delhi NCR.
        </p>
      </div>

      <EventForm />
    </div>
  );
}
