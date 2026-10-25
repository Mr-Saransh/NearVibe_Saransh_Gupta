'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Filter,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  Navigation,
  Calendar,
  X,
  Compass,
  ArrowUpDown,
  Tag,
  DollarSign,
  Radio,
} from 'lucide-react';
import { EventItem, EventCategory, EventFormat, DateFilter, PriceFilter, SortOption } from '@/types';
import EventCard from '@/components/EventCard';
import InteractiveMap from '@/components/InteractiveMap';
import { useUser } from '@/lib/context/UserContext';
import { NCR_CITIES } from '@/lib/utils/geo';

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentUser,
    selectedCity,
    setSelectedCity,
    userCoordinates,
    radiusKm,
    setRadiusKm,
    hasLiveLocation,
    requestLiveLocation,
    isLocating,
  } = useUser();

  // Search & filter states initialized from URL params
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState<string>(searchParams.get('category') || 'All');
  const [dateRange, setDateRange] = useState<DateFilter>(
    (searchParams.get('dateRange') as DateFilter) || 'all'
  );
  const [format, setFormat] = useState<string>(searchParams.get('format') || 'all');
  const [priceType, setPriceType] = useState<PriceFilter>(
    (searchParams.get('priceType') as PriceFilter) || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sortBy') as SortOption) || 'relevance'
  );

  // View mode: 'split' on desktop, or toggle between 'list' and 'map'
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('split');
  const [selectedMapEventId, setSelectedMapEventId] = useState<string | undefined>();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Event data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    'All',
    'Hackathons',
    'AI & ML',
    'Technology',
    'Startups & Business',
    'Design & UI/UX',
    'Education & Workshops',
    'Music & Arts',
    'Community & Social',
  ];

  // Fetch filtered events
  useEffect(() => {
    async function fetchFilteredEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (category && category !== 'All') params.set('category', category);
        if (selectedCity && selectedCity !== 'All NCR') params.set('city', selectedCity);
        if (dateRange !== 'all') params.set('dateRange', dateRange);
        if (format !== 'all') params.set('format', format);
        if (priceType !== 'all') params.set('priceType', priceType);
        if (sortBy) params.set('sortBy', sortBy);

        if (currentUser?.id) params.set('userId', currentUser.id);

        if (userCoordinates) {
          params.set('userLat', userCoordinates.latitude.toString());
          params.set('userLng', userCoordinates.longitude.toString());
          params.set('maxDistanceKm', radiusKm.toString());
        }

        const res = await fetch(`/api/events?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.events) {
          setEvents(data.events);
        }
      } catch (err) {
        console.warn('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredEvents();
  }, [
    query,
    category,
    selectedCity,
    dateRange,
    format,
    priceType,
    sortBy,
    userCoordinates?.latitude,
    userCoordinates?.longitude,
    radiusKm,
    currentUser?.id,
  ]);

  const clearAllFilters = () => {
    setQuery('');
    setCategory('All');
    setDateRange('all');
    setFormat('all');
    setPriceType('all');
    setSortBy('relevance');
    setSelectedCity('Noida');
  };

  const hasActiveFilters =
    query ||
    category !== 'All' ||
    dateRange !== 'all' ||
    format !== 'all' ||
    priceType !== 'all' ||
    sortBy !== 'relevance';

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Top Filter Strip */}
      <section className="sticky top-16 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 py-3 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, venues, keywords..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Selectors & View Toggles */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              
              {/* City Hub Picker */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              >
                {NCR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* GPS Button */}
              <button
                onClick={requestLiveLocation}
                disabled={isLocating}
                title="Detect live GPS coordinates"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  hasLiveLocation
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200'
                }`}
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {hasLiveLocation ? 'GPS Active' : 'My GPS'}
                </span>
              </button>

              {/* Radius Slider dropdown */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300">
                <span className="text-zinc-400 font-normal">Radius:</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                  className="bg-transparent font-bold text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                  <option value={100}>100 km</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs text-zinc-700 dark:text-zinc-300">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Top Match</option>
                  <option value="nearest">Nearest First</option>
                  <option value="soonest">Happening Soonest</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>

              {/* View switch buttons */}
              <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => setViewMode('split')}
                  title="Split List & Map"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Cards Only"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  title="Map View"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

          {/* Secondary Filter Pills: Category, Date, Price, Format */}
          <div className="flex items-center gap-2 pt-2.5 overflow-x-auto scrollbar-none text-xs">
            {/* Category pills */}
            {categories.slice(0, 7).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                  category === cat
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-1" />

            {/* Price Filter: Free only */}
            <button
              onClick={() => setPriceType(priceType === 'free' ? 'all' : 'free')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                priceType === 'free'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              Free Only
            </button>

            {/* Date filter: This Weekend */}
            <button
              onClick={() => setDateRange(dateRange === 'weekend' ? 'all' : 'weekend')}
              className={`whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                dateRange === 'weekend'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              This Weekend
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        
        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Showing <span className="font-bold text-zinc-900 dark:text-white">{events.length}</span>{' '}
            events around {selectedCity} (within {radiusKm} km)
          </p>

          {/* Mobile view switch pills */}
          <div className="lg:hidden flex items-center gap-1 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode !== 'map' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-zinc-500'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'map' ? 'bg-white dark:bg-zinc-800 text-rose-500 shadow-sm' : 'text-zinc-500'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {/* View Layout Switcher */}
        {viewMode === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col: Event Cards List */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse"
                    >
                      <div className="w-full aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
                    </div>
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedMapEventId(evt.id)}
                      onMouseEnter={() => setSelectedMapEventId(evt.id)}
                      className="transition-transform duration-200"
                    >
                      <EventCard
                        event={evt}
                        isSelected={selectedMapEventId === evt.id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState onReset={clearAllFilters} />
              )}
            </div>

            {/* Right Col: Sticky Interactive Leaflet Map */}
            <div className="hidden lg:block lg:col-span-5 xl:col-span-5 sticky top-40 h-[calc(100vh-200px)]">
              <InteractiveMap
                events={events}
                centerLat={userCoordinates?.latitude || 28.5355}
                centerLng={userCoordinates?.longitude || 77.3910}
                selectedEventId={selectedMapEventId}
                onSelectEvent={(id) => setSelectedMapEventId(id)}
              />
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid Only View
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 animate-pulse"
                  >
                    <div className="w-full aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            ) : (
              <EmptyState onReset={clearAllFilters} />
            )}
          </div>
        ) : (
          // Fullscreen Map View
          <div className="w-full h-[calc(100vh-220px)] rounded-2xl overflow-hidden shadow-lg">
            <InteractiveMap
              events={events}
              centerLat={userCoordinates?.latitude || 28.5355}
              centerLng={userCoordinates?.longitude || 77.3910}
              zoom={12}
              selectedEventId={selectedMapEventId}
              onSelectEvent={(id) => setSelectedMapEventId(id)}
            />
          </div>
        )}

      </div>

    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4">
      <Compass className="w-12 h-12 text-zinc-400 mx-auto" />
      <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
        No events match your criteria
      </h3>
      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
        No active events found within this distance or category. Try clearing your filters or widening your radius.
      </p>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
      >
        Clear All Filters
      </button>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
