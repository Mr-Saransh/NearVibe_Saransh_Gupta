'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { DEMO_ATTENDEE, DEMO_ORGANIZER } from '@/lib/data/seedData';
import { NCR_CITIES } from '@/lib/utils/geo';
import { useToast } from './ToastContext';

interface UserContextType {
  currentUser: UserProfile;
  isOrganizer: boolean;
  switchIdentity: (role: 'attendee' | 'organizer' | 'custom', customUser?: UserProfile) => void;
  // Location
  selectedCity: string;
  userCoordinates: { latitude: number; longitude: number } | null;
  radiusKm: number;
  hasLiveLocation: boolean;
  isLocating: boolean;
  requestLiveLocation: () => Promise<void>;
  setSelectedCity: (city: string) => void;
  setRadiusKm: (km: number) => void;
  // Events state
  savedEventIds: string[];
  registeredEventIds: string[];
  isEventSaved: (id: string) => boolean;
  isEventRegistered: (id: string) => boolean;
  toggleSave: (eventId: string) => Promise<boolean>;
  registerForEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  cancelRegistration: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  // System mode
  dbConnected: boolean;
  isDemoMode: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER_ROLE: 'nearvibe_user_role',
  CUSTOM_USER: 'nearvibe_custom_user',
  SAVED_IDS: 'nearvibe_saved_event_ids',
  REG_IDS: 'nearvibe_registered_event_ids',
  CITY: 'nearvibe_selected_city',
  COORDS: 'nearvibe_user_coords',
  RADIUS: 'nearvibe_radius_km',
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_ATTENDEE);
  const [selectedCity, setSelectedCityState] = useState<string>('Noida');
  const [userCoordinates, setUserCoordinates] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 28.5355,
    longitude: 77.3910, // Default Noida
  });
  const [radiusKm, setRadiusKmState] = useState<number>(30);
  const [hasLiveLocation, setHasLiveLocation] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [savedEventIds, setSavedEventIds] = useState<string[]>(['evt-002']);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>(['evt-001']);
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Load initial client preferences
  useEffect(() => {
    try {
      // Check database status
      fetch('/api/status')
        .then((res) => res.json())
        .then((data) => {
          setDbConnected(Boolean(data.databaseConnected));
          setIsDemoMode(!data.databaseConnected || data.mode?.includes('Demo'));
        })
        .catch(() => {
          setDbConnected(false);
          setIsDemoMode(true);
        });

      // Role restore
      const savedRole = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ROLE);
      if (savedRole === 'organizer') {
        setCurrentUser(DEMO_ORGANIZER);
      } else if (savedRole === 'custom') {
        const custom = localStorage.getItem(STORAGE_KEYS.CUSTOM_USER);
        if (custom) setCurrentUser(JSON.parse(custom));
      } else {
        setCurrentUser(DEMO_ATTENDEE);
      }

      // City & coords restore
      const savedCity = localStorage.getItem(STORAGE_KEYS.CITY);
      if (savedCity) setSelectedCityState(savedCity);

      const savedCoords = localStorage.getItem(STORAGE_KEYS.COORDS);
      if (savedCoords) setUserCoordinates(JSON.parse(savedCoords));

      const savedRadius = localStorage.getItem(STORAGE_KEYS.RADIUS);
      if (savedRadius) setRadiusKmState(parseInt(savedRadius, 10));

      const savedSaves = localStorage.getItem(STORAGE_KEYS.SAVED_IDS);
      if (savedSaves) setSavedEventIds(JSON.parse(savedSaves));

      const savedRegs = localStorage.getItem(STORAGE_KEYS.REG_IDS);
      if (savedRegs) setRegisteredEventIds(JSON.parse(savedRegs));
    } catch (e) {
      console.warn('LocalStorage initialization notice:', e);
    }
  }, []);

  const switchIdentity = useCallback(
    (role: 'attendee' | 'organizer' | 'custom', customUser?: UserProfile) => {
      if (role === 'organizer') {
        setCurrentUser(DEMO_ORGANIZER);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, 'organizer');
        addToast('Switched to Organizer: TechHub NCR', 'info', 'Persona Changed');
      } else if (role === 'custom' && customUser) {
        setCurrentUser(customUser);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, 'custom');
        localStorage.setItem(STORAGE_KEYS.CUSTOM_USER, JSON.stringify(customUser));
        addToast(`Signed in as ${customUser.name}`, 'success');
      } else {
        setCurrentUser(DEMO_ATTENDEE);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ROLE, 'attendee');
        addToast('Switched to Attendee: Aarav Sharma', 'info', 'Persona Changed');
      }
    },
    [addToast]
  );

  const setSelectedCity = useCallback((city: string) => {
    setSelectedCityState(city);
    localStorage.setItem(STORAGE_KEYS.CITY, city);

    // Update coordinates to city hub
    const hub = NCR_CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase());
    if (hub) {
      const coords = { latitude: hub.latitude, longitude: hub.longitude };
      setUserCoordinates(coords);
      localStorage.setItem(STORAGE_KEYS.COORDS, JSON.stringify(coords));
      setHasLiveLocation(false);
    } else if (city === 'All NCR') {
      setUserCoordinates({ latitude: 28.6139, longitude: 77.2090 });
    }
  }, []);

  const setRadiusKm = useCallback((km: number) => {
    setRadiusKmState(km);
    localStorage.setItem(STORAGE_KEYS.RADIUS, km.toString());
  }, []);

  const requestLiveLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'warning');
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;
      const coords = { latitude, longitude };
      setUserCoordinates(coords);
      setHasLiveLocation(true);
      localStorage.setItem(STORAGE_KEYS.COORDS, JSON.stringify(coords));
      addToast('Live location detected. Events sorted by true proximity.', 'success', 'GPS Enabled');
    } catch (err: any) {
      console.warn('Geolocation denied or timed out:', err);
      // Graceful fallback
      addToast(
        'Location permission denied or unavailable. Defaulting to Delhi NCR city selection.',
        'info',
        'Manual Location Fallback'
      );
      setHasLiveLocation(false);
    } finally {
      setIsLocating(false);
    }
  }, [addToast]);

  const isEventSaved = useCallback(
    (id: string) => savedEventIds.includes(id),
    [savedEventIds]
  );

  const isEventRegistered = useCallback(
    (id: string) => registeredEventIds.includes(id),
    [registeredEventIds]
  );

  const toggleSave = useCallback(
    async (eventId: string): Promise<boolean> => {
      const isCurrentlySaved = savedEventIds.includes(eventId);
      const nextSaved = isCurrentlySaved
        ? savedEventIds.filter((id) => id !== eventId)
        : [...savedEventIds, eventId];

      setSavedEventIds(nextSaved);
      localStorage.setItem(STORAGE_KEYS.SAVED_IDS, JSON.stringify(nextSaved));

      // Call API in background
      try {
        await fetch(`/api/events/${eventId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
      } catch (err) {
        console.warn('API save sync notice (cached locally):', err);
      }

      addToast(
        isCurrentlySaved ? 'Removed from saved events' : 'Saved to your bookmarks',
        'info'
      );
      return !isCurrentlySaved;
    },
    [savedEventIds, currentUser.id, addToast]
  );

  const registerForEvent = useCallback(
    async (eventId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`/api/events/${eventId}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });

        const data = await res.json();

        if (!data.success) {
          addToast(data.error || 'Registration could not be completed', 'error', 'Registration Notice');
          return { success: false, error: data.error };
        }

        const nextRegs = [...registeredEventIds, eventId];
        setRegisteredEventIds(nextRegs);
        localStorage.setItem(STORAGE_KEYS.REG_IDS, JSON.stringify(nextRegs));

        addToast('You are officially registered! Spot reserved.', 'success', 'Confirmed');
        return { success: true };
      } catch (err: any) {
        // Local fallback if offline
        const nextRegs = [...registeredEventIds, eventId];
        setRegisteredEventIds(nextRegs);
        localStorage.setItem(STORAGE_KEYS.REG_IDS, JSON.stringify(nextRegs));
        addToast('Registered in local demo mode.', 'success', 'Registered');
        return { success: true };
      }
    },
    [currentUser.id, registeredEventIds, addToast]
  );

  const cancelRegistration = useCallback(
    async (eventId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await fetch(`/api/events/${eventId}/register?userId=${currentUser.id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.warn('Cancel registration sync notice:', err);
      }

      const nextRegs = registeredEventIds.filter((id) => id !== eventId);
      setRegisteredEventIds(nextRegs);
      localStorage.setItem(STORAGE_KEYS.REG_IDS, JSON.stringify(nextRegs));
      addToast('Registration cancelled. Your spot has been released.', 'info', 'Cancelled');
      return { success: true };
    },
    [currentUser.id, registeredEventIds, addToast]
  );

  return (
    <UserContext.Provider
      value={{
        currentUser,
        isOrganizer: currentUser.role === 'organizer',
        switchIdentity,
        selectedCity,
        userCoordinates,
        radiusKm,
        hasLiveLocation,
        isLocating,
        requestLiveLocation,
        setSelectedCity,
        setRadiusKm,
        savedEventIds,
        registeredEventIds,
        isEventSaved,
        isEventRegistered,
        toggleSave,
        registerForEvent,
        cancelRegistration,
        dbConnected,
        isDemoMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
