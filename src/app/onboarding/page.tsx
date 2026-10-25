'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  MapPin,
  Check,
  Navigation,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { NCR_CITIES } from '@/lib/utils/geo';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

const AVAILABLE_INTERESTS = [
  'Hackathons',
  'AI & ML',
  'Technology',
  'Startups & Business',
  'Design & UI/UX',
  'Education & Workshops',
  'Music & Arts',
  'Community & Social',
  'Networking',
];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    currentUser,
    selectedCity,
    setSelectedCity,
    radiusKm,
    setRadiusKm,
    requestLiveLocation,
    hasLiveLocation,
    isLocating,
  } = useUser();
  const { addToast } = useToast();

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser.interests || ['Hackathons', 'Technology', 'AI & ML']
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          interests: selectedInterests,
          preferredCity: selectedCity,
          preferredRadiusKm: radiusKm,
        }),
      });

      addToast('Preferences saved! Your recommendations have been personalized.', 'success', 'Personalized');
      router.push('/');
    } catch {
      addToast('Preferences saved locally.', 'success');
      router.push('/');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
          Personalize Your Event Radar
        </h1>
        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
          Tell NearVibe what you love and where you hang out. Our transparent scoring engine matches you with relevant gatherings without invasive tracking.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Step 1: Select Interests */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              1. What kind of events excite you?
            </h2>
            <span className="text-[11px] font-semibold text-rose-500">
              {selectedInterests.length} selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {AVAILABLE_INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span>{interest}</span>
                  {selected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Location & Region */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
            2. Choose your base locality in Delhi NCR
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Preferred Hub
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {NCR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Discovery Radius
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value={5}>Within 5 km (Hyperlocal walking/metro)</option>
                <option value={10}>Within 10 km (Neighbouring sectors)</option>
                <option value={25}>Within 25 km (Cross-city commute)</option>
                <option value={50}>Within 50 km (Entire Delhi NCR)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-zinc-500">Want live GPS calculation?</span>
            <button
              type="button"
              onClick={requestLiveLocation}
              disabled={isLocating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                hasLiveLocation
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{hasLiveLocation ? 'Live GPS Active' : 'Enable My GPS'}</span>
            </button>
          </div>
        </div>

        {/* Transparent scoring explanation */}
        <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Transparent Recommendation Scoring</span>
          </p>
          <p className="text-[11px] leading-relaxed">
            Your event feed is computed directly in your browser or server using: 40% Interest Match + 30% Distance Proximity (Haversine Formula) + 15% Imminence (Happening soon) + 15% Registration Demand.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSave}
            disabled={submitting || selectedInterests.length === 0}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-xl shadow-rose-600/30 transition-all hover:scale-105"
          >
            <span>{submitting ? 'Updating Feed...' : 'Save Preferences & Explore Events'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
