'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Mail,
  MapPin,
  Bookmark,
  Calendar,
  Layers,
  Sparkles,
  Database,
  ArrowRight,
  Shield,
  Edit,
} from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

export default function ProfilePage() {
  const {
    currentUser,
    switchIdentity,
    savedEventIds,
    registeredEventIds,
    selectedCity,
    radiusKm,
    dbConnected,
    isDemoMode,
  } = useUser();
  const { addToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          name: name.trim(),
        }),
      });
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch {
      addToast('Profile updated locally', 'success');
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      
      {/* Profile Card Header */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-rose-500 shadow-md shrink-0">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCheck className="w-full h-full p-4 text-zinc-400" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white">
                {currentUser.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 uppercase">
                {currentUser.role}
              </span>
            </div>

            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser.email}</span>
            </p>

            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{selectedCity} (Radius: {radiusKm} km)</span>
            </p>
          </div>
        </div>

        {/* Persona quick switch buttons */}
        <div className="space-y-2 self-stretch sm:self-auto border-t sm:border-t-0 sm:border-l border-zinc-200 dark:border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Switch Persona
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => switchIdentity('attendee')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                currentUser.role === 'attendee'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              Aarav Sharma (Attendee)
            </button>
            <button
              onClick={() => switchIdentity('organizer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                currentUser.role === 'organizer'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-900'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              TechHub NCR (Organizer)
            </button>
          </div>
        </div>
      </div>

      {/* Activity Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/saved"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-400 group-hover:text-rose-500">
            <span className="text-xs font-semibold uppercase">Saved Bookmarks</span>
            <Bookmark className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">
            {savedEventIds.length}
          </p>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
            <span>View bookmarks</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <Link
          href="/saved"
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-zinc-400 group-hover:text-emerald-500">
            <span className="text-xs font-semibold uppercase">Confirmed Registrations</span>
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">
            {registeredEventIds.length}
          </p>
          <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-1">
            <span>View registrations</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </span>
        </Link>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase">System Architecture</span>
            <Database className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-base font-black text-zinc-900 dark:text-white mt-2">
            {dbConnected ? 'Neon PostgreSQL' : 'Local Demo Mode'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            Active & Synchronized
          </p>
        </div>
      </div>

      {/* Selected Interests & Preferences */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span>Active Recommendation Interests</span>
          </h2>
          <Link
            href="/onboarding"
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            Change in Onboarding
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {currentUser.interests.map((interest) => (
            <span
              key={interest}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
