'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Flame,
  Calendar,
  Compass,
  Layers,
  ChevronRight,
  SlidersHorizontal,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { EventItem } from '@/types';
import EventCard from '@/components/EventCard';
import { useUser } from '@/lib/context/UserContext';
import { rankEventsForUser } from '@/lib/utils/recommendations';
import { isDateThisWeekend } from '@/lib/utils/date';

export default function HomePage() {
  const router = useRouter();
  const {
    currentUser,
    selectedCity,
    userCoordinates,
    radiusKm,
    hasLiveLocation,
    requestLiveLocation,
    isLocating,
  } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommended' | 'weekend' | 'nearby'>('recommended');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    { label: 'All Events', value: 'All' },
    { label: 'Hackathons', value: 'Hackathons' },
    { label: 'AI & ML', value: 'AI & ML' },
    { label: 'Technology', value: 'Technology' },
    { label: 'Startups & Business', value: 'Startups & Business' },
    { label: 'Design & UI/UX', value: 'Design & UI/UX' },
    { label: 'Education & Workshops', value: 'Education & Workshops' },
    { label: 'Music & Arts', value: 'Music & Arts' },
    { label: 'Community & Social', value: 'Community & Social' },
  ];

  useEffect(() => {
    async function fetchHomeEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (currentUser?.id) params.set('userId', currentUser.id);
        if (userCoordinates) {
          params.set('userLat', userCoordinates.latitude.toString());
          params.set('userLng', userCoordinates.longitude.toString());
          params.set('maxDistanceKm', radiusKm.toString());
        }
        if (selectedCity && selectedCity !== 'All NCR') {
          params.set('city', selectedCity);
        }

        const res = await fetch(`/api/events?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.events) {
          setEvents(data.events);
        }
      } catch (err) {
        console.warn('Failed to load home events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomeEvents();
  }, [currentUser?.id, selectedCity, userCoordinates?.latitude, userCoordinates?.longitude, radiusKm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/discover');
    }
  };

  // Filtered views
  let displayedEvents = events;
  if (selectedCategory !== 'All') {
    displayedEvents = displayedEvents.filter((e) => e.category === selectedCategory);
  }

  if (activeTab === 'weekend') {
    displayedEvents = displayedEvents.filter((e) => isDateThisWeekend(e.startTime));
  } else if (activeTab === 'nearby') {
    displayedEvents = [...displayedEvents].sort((a, b) => {
      if (a.distanceKm === undefined && b.distanceKm === undefined) return 0;
      if (a.distanceKm === undefined) return 1;
      if (b.distanceKm === undefined) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    // Recommended
    displayedEvents = rankEventsForUser(
      displayedEvents,
      currentUser,
      userCoordinates?.latitude,
      userCoordinates?.longitude
    );
  }

  const featuredEvents = events.filter((e) => e.featured).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-rose-50/60 via-white to-zinc-50 dark:from-zinc-900/60 dark:via-zinc-950 dark:to-zinc-950 py-16 md:py-24 border-b border-zinc-200/80 dark:border-zinc-800">
        
        {/* Subtle decorative futuristic ambient lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-96 h-96 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-3xl" />
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Hyperlocal Event Discovery Across Delhi NCR
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-white max-w-3xl mx-auto leading-[1.12]">
            Discover nearby.{' '}
            <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-violet-600 bg-clip-text text-transparent">
              Connect locally.
            </span>{' '}
            Build community.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Replace scattered WhatsApp groups and social posts with one personalized discovery feed. Find hackathons, tech workshops, founder mixers, and community gatherings within your radius.
          </p>

          {/* Central Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200/90 dark:border-zinc-800 p-2 transition-all focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-transparent"
            >
              <Search className="w-5 h-5 text-zinc-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find hackathons, AI workshops, meetups near you..."
                className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-500/20 shrink-0 transition-all hover:scale-[1.02]"
              >
                <span>Find Events</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Suggestions & GPS Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-zinc-500">
              <span className="font-medium">Trending searches:</span>
              <button
                onClick={() => router.push('/discover?category=Hackathons')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                #Hackathons
              </button>
              <span>•</span>
              <button
                onClick={() => router.push('/discover?category=AI+%26+ML')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                #GenerativeAI
              </button>
              <span>•</span>
              <button
                onClick={() => router.push('/discover?priceType=free')}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              >
                #FreeEvents
              </button>
              <span>•</span>
              <button
                onClick={requestLiveLocation}
                disabled={isLocating}
                className="text-rose-600 dark:text-rose-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{hasLiveLocation ? 'Using My GPS' : 'Use My GPS'}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Featured / Trending Carousel / Spotlight */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Spotlight & Trending Across NCR
              </h2>
            </div>
            <Link
              href="/discover?featured=true"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>View all spotlight</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} priority />
            ))}
          </div>
        </section>
      )}

      {/* Main Personalized Feed & Tab Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Section Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
          
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Curated Event Discovery
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Personalized based on {currentUser.name}&apos;s profile ({currentUser.interests.join(', ')}) in {selectedCity}
            </p>
          </div>

          {/* Feed Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 self-start">
            <button
              onClick={() => setActiveTab('recommended')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recommended'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended</span>
            </button>

            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'nearby'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Nearest</span>
            </button>

            <button
              onClick={() => setActiveTab('weekend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'weekend'
                  ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>This Weekend</span>
            </button>
          </div>

        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedCategory === cat.value
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid of Events or Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse"
              >
                <div className="w-full aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEvents.map((evt) => (
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4">
            <Compass className="w-12 h-12 text-zinc-400 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              No events found for this filter
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your category or expanding your discovery radius in {selectedCity}.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setActiveTab('recommended');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800"
              >
                Reset Filters
              </button>
              <Link
                href="/discover"
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Open Map View
              </Link>
            </div>
          </div>
        )}

        {/* Call to action for organizers */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-bold tracking-wider uppercase text-rose-400">
              For Community Leaders & Hackathon Hosts
            </span>
            <h3 className="text-2xl font-bold tracking-tight">
              Hosting an event in Delhi NCR?
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Publish your hackathon, tech workshop, or meetup to reach thousands of passionate local developers and students directly without ad spend.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 whitespace-nowrap transition-transform hover:scale-105"
          >
            Publish Your Event Free →
          </Link>
        </div>

      </section>

    </div>
  );
}
