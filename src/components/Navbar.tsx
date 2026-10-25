'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  MapPin,
  Bookmark,
  Radio,
  UserCheck,
  ChevronDown,
  Navigation,
  Layers,
  Users,
  Calendar,
  Upload,
  Sparkles,
  LogOut,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';
import { NCR_CITIES } from '@/lib/utils/geo';

export default function Navbar() {
  const pathname = usePathname();
  const {
    currentUser,
    switchIdentity,
    isOrganizer,
    isLoggedIn,
    logout,
    selectedCity,
    setSelectedCity,
    hasLiveLocation,
    requestLiveLocation,
    isLocating,
    savedEventIds,
  } = useUser();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setCityDropdownOpen(false);
    setPersonaDropdownOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // When not logged in: Clean minimal navbar
  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
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

            <Link
              href="/login"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all hover:scale-[1.02]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
    );
  }

  const navLinks = [
    { href: '/', label: 'Explore', icon: Sparkles },
    { href: '/discover', label: 'Discover', icon: Compass },
    ...(isOrganizer ? [{ href: '/capture', label: 'Capture', icon: Upload }] : []),
    { href: '/squadup', label: 'SquadUp', icon: Users },
    { href: '/planner', label: 'Planner', icon: Calendar },
    { href: '/saved', label: 'Saved', icon: Bookmark, badge: savedEventIds.length },
    ...(isOrganizer ? [{ href: '/organizer', label: 'Organizer', icon: Layers }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 xl:gap-4 flex-nowrap">
            
            {/* Left: Brand Logo & Desktop City Selector */}
            <div className="flex items-center gap-2.5 xl:gap-4 shrink-0">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform shrink-0">
                  <Radio className="w-4 h-4 xl:w-5 xl:h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg xl:text-xl font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
                    Near<span className="text-rose-600 dark:text-rose-500">Vibe</span>
                  </span>
                  <span className="text-[9px] xl:text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider uppercase font-medium mt-0.5 hidden sm:block">
                    Hyperlocal
                  </span>
                </div>
              </Link>

              {/* Desktop City Selector */}
              <div className="relative hidden lg:block shrink-0">
                <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-full px-2.5 py-1 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mr-1" />
                  <button
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                    className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white focus:outline-none"
                    aria-expanded={cityDropdownOpen}
                  >
                    <span className="truncate max-w-[85px] xl:max-w-[120px] font-semibold text-[11px] xl:text-xs">
                      {hasLiveLocation ? 'GPS' : selectedCity}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-400" />
                  </button>

                  <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700 mx-1.5" />

                  <button
                    onClick={requestLiveLocation}
                    disabled={isLocating}
                    title="Detect live browser coordinates"
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium text-[10px] xl:text-[11px] transition-all ${
                      hasLiveLocation
                        ? 'bg-rose-500 text-white'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Navigation className={`w-2.5 h-2.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span className="hidden xl:inline">{isLocating ? '...' : 'Nearby'}</span>
                  </button>
                </div>

                {/* City Dropdown Menu */}
                {cityDropdownOpen && (
                  <div
                    className="absolute left-0 mt-2 w-52 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setCityDropdownOpen(false)}
                  >
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Select NCR Region
                    </div>
                    {NCR_CITIES.map((city) => (
                      <button
                        key={city.name}
                        onClick={() => {
                          setSelectedCity(city.name);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors ${
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
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 shrink min-w-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1 xl:gap-1.5 px-2 py-1.5 xl:px-3 xl:py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-900 text-rose-600 dark:text-rose-400'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                    <span>{link.label}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Persona dropdown on Desktop & Sidebar Hamburger on Mobile */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Desktop Persona Switcher */}
              <div className="relative hidden lg:block shrink-0">
                <button
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="flex items-center gap-1.5 px-2 py-1 xl:px-3 xl:py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors"
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
                  <div className="flex flex-col text-left leading-tight">
                    <span className="font-semibold text-zinc-900 dark:text-white max-w-[85px] xl:max-w-[120px] truncate text-[11px] xl:text-xs">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 capitalize">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {personaDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 rounded-xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 py-2 z-50 animate-in fade-in slide-in-from-top-1"
                    onMouseLeave={() => setPersonaDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                        Switch Identity
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        Test both sides of NearVibe
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
                            🎓 Aarav Sharma (Candidate)
                          </p>
                          <p className="text-[10px] text-zinc-500">
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
                            ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-950 dark:text-violet-200 font-medium'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full mt-1.5 bg-violet-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-white">
                            🏢 TechHub NCR (Organizer)
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            Publish events, view analytics
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-1 mt-1 border-t border-zinc-100 dark:border-zinc-800 px-2">
                      <button
                        onClick={() => {
                          logout();
                          setPersonaDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Quick City indicator */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                <MapPin className="w-3 h-3 text-rose-500" />
                <span className="font-semibold text-[11px]">
                  {hasLiveLocation ? 'GPS' : selectedCity}
                </span>
              </button>

              {/* Mobile Hamburger Button to open Sidebar Drawer */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                aria-label="Open Navigation Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MOBILE SLIDE-OUT SIDEBAR DRAWER                             */}
      {/* ============================================================ */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-200 overflow-y-auto">
            
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 via-rose-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
                    <Radio className="w-4 h-4" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                    Near<span className="text-rose-600 dark:text-rose-500">Vibe</span>
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Persona Profile Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 shrink-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCheck className="w-full h-full p-2 text-zinc-500" />
                    )}
                  </div>
                  <div className="leading-tight">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">
                      {currentUser.name}
                    </p>
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${
                      isOrganizer
                        ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                    }`}>
                      {isOrganizer ? '🏢 Organizer' : '🎓 Candidate'}
                    </span>
                  </div>
                </div>

                {/* Identity Quick Switcher */}
                <button
                  onClick={() => {
                    switchIdentity(isOrganizer ? 'attendee' : 'organizer');
                  }}
                  className="w-full py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Switch to {isOrganizer ? 'Candidate' : 'Organizer'} Mode</span>
                  <ArrowRight className="w-3 h-3 text-rose-500" />
                </button>
              </div>

              {/* Location Picker in Drawer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>Location Hub</span>
                  <button
                    onClick={requestLiveLocation}
                    disabled={isLocating}
                    className="text-rose-600 dark:text-rose-400 lowercase font-medium flex items-center gap-1"
                  >
                    <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{hasLiveLocation ? 'gps active' : 'use gps'}</span>
                  </button>
                </div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  {NCR_CITIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-2 pb-1">
                  Navigation
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </div>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-950/60 bg-red-50/60 dark:bg-red-950/20 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              <p className="text-[10px] text-zinc-400 text-center">
                NearVibe &bull; Hyperlocal Delhi NCR
              </p>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
