'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  MapPin,
  Bookmark,
  PlusCircle,
  Radio,
  UserCheck,
  ChevronDown,
  Navigation,
  Database,
  Layers,
  Users,
  Calendar,
  Upload,
} from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';
import { NCR_CITIES } from '@/lib/utils/geo';

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    switchIdentity,
    isOrganizer,
    selectedCity,
    setSelectedCity,
    hasLiveLocation,
    requestLiveLocation,
    isLocating,
    savedEventIds,
    dbConnected,
    isDemoMode,
  } = useUser();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Explore', icon: Sparkles },
    { href: '/discover', label: 'Discover', icon: Compass },
    { href: '/capture', label: 'Capture', icon: Upload },
    { href: '/squadup', label: 'SquadUp', icon: Users },
    { href: '/planner', label: 'Planner', icon: Calendar },
    { href: '/saved', label: 'Saved', icon: Bookmark, badge: savedEventIds.length },
    { href: '/organizer', label: 'Organizer', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
                  Near<span className="text-rose-600 dark:text-rose-500">Vibe</span>
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider uppercase font-medium mt-0.5">
                  Hyperlocal Events
                </span>
              </div>
            </Link>

            {/* City Selector & GPS trigger */}
            <div className="relative hidden md:block">
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full pl-3 pr-2 py-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mr-1.5" />
                <button
                  onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                  className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white focus:outline-none"
                  aria-expanded={cityDropdownOpen}
                >
                  <span>{hasLiveLocation ? 'GPS: My Location' : selectedCity}</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                <div className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-700 mx-2" />

                <button
                  onClick={requestLiveLocation}
                  disabled={isLocating}
                  title="Detect live browser coordinates"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium transition-all ${
                    hasLiveLocation
                      ? 'bg-rose-500 text-white'
                      : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Locating...' : 'Nearby'}</span>
                </button>
              </div>

              {/* City Dropdown Menu */}
              {cityDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setCityDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Select Delhi NCR Region
                  </div>
                  {NCR_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => {
                        setSelectedCity(city.name);
                        setCityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
                        selectedCity === city.name && !hasLiveLocation
                          ? 'font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>{city.label}</span>
                      {selectedCity === city.name && !hasLiveLocation && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions: Persona switcher, DB status, Create Event CTA */}
          <div className="flex items-center gap-3">
            
            {/* Database / Demo Badge */}
            <div
              title={
                dbConnected
                  ? 'Connected to Live Neon PostgreSQL Database'
                  : 'Running in Local Persistent Demo Mode'
              }
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                dbConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
              }`}
            >
              <Database className="w-3 h-3" />
              <span>{dbConnected ? 'Neon DB' : 'Demo Mode'}</span>
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
                aria-expanded={personaDropdownOpen}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCheck className="w-full h-full p-1 text-zinc-500" />
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-zinc-900 dark:text-white max-w-[110px] truncate">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
              </button>

              {personaDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                  onMouseLeave={() => setPersonaDropdownOpen(false)}
                >
                  <div className="px-3.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                      Instant Persona Switcher
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Test both sides of NearVibe instantly
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        switchIdentity('attendee');
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 text-xs transition-colors ${
                        currentUser.role === 'attendee'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-medium'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full mt-1.5 bg-rose-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          Aarav Sharma (Attendee)
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Student builder, AI & Hackathons
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        switchIdentity('organizer');
                        setPersonaDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 text-xs transition-colors ${
                        currentUser.role === 'organizer'
                          ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 font-medium'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full mt-1.5 bg-violet-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-white">
                          TechHub NCR (Organizer)
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Publish events, view attendee analytics
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="pt-1 mt-1 border-t border-zinc-100 dark:border-zinc-800 px-3 py-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <Link
                      href="/onboarding"
                      onClick={() => setPersonaDropdownOpen(false)}
                      className="text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      Edit Preferences
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setPersonaDropdownOpen(false)}
                      className="hover:underline"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Create Event CTA */}
            <Link
              href="/organizer/events/new"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all hover:shadow"
            >
              <PlusCircle className="w-3.5 h-3.5 text-rose-400 dark:text-rose-600" />
              <span>Post Event</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-zinc-200 dark:border-zinc-800 py-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-rose-500 text-white">
                    {link.badge}
                  </span>
                )}
              </div>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
