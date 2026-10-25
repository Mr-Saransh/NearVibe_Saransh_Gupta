'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/types';
import { MapPin, Navigation, ExternalLink, AlertCircle } from 'lucide-react';
import { formatEventDateTime } from '@/lib/utils/date';
import { formatDistance } from '@/lib/utils/geo';

interface InteractiveMapProps {
  events: EventItem[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  selectedEventId?: string;
  onSelectEvent?: (eventId: string) => void;
}

export default function InteractiveMap({
  events,
  centerLat = 28.5355, // Noida Sec 62
  centerLng = 77.3910,
  zoom = 11,
  selectedEventId,
  onSelectEvent,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filter events with valid coordinates
  const mappedEvents = events.filter(
    (e) =>
      e.latitude !== undefined &&
      e.longitude !== undefined &&
      !isNaN(e.latitude) &&
      !isNaN(e.longitude)
  );

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      try {
        // Dynamically import Leaflet to avoid SSR errors
        const L = (await import('leaflet')).default;

        // Ensure Leaflet CSS is injected
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Clean up previous instance if exists
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom,
          zoomControl: false,
        });

        // Add zoom control top right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // OpenStreetMap tile layer (no paid key needed!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;

        // Custom marker icon generator
        const createCustomIcon = (isSelected: boolean, category: string) => {
          return L.divIcon({
            className: 'custom-event-marker',
            html: `
              <div style="
                width: ${isSelected ? '36px' : '30px'};
                height: ${isSelected ? '36px' : '30px'};
                background: ${isSelected ? '#FF4B4B' : '#18181B'};
                color: #ffffff;
                border: 2px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                cursor: pointer;
                transition: all 0.2s ease;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
            `,
            iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
            iconAnchor: [isSelected ? 18 : 15, isSelected ? 36 : 30],
            popupAnchor: [0, isSelected ? -36 : -30],
          });
        };

        // Clear markers ref
        markersRef.current = {};

        // Add markers
        mappedEvents.forEach((evt) => {
          if (!evt.latitude || !evt.longitude) return;

          const isSelected = evt.id === selectedEventId;
          const marker = L.marker([evt.latitude, evt.longitude], {
            icon: createCustomIcon(isSelected, evt.category),
          }).addTo(map);

          // Popup HTML
          const popupContent = `
            <div style="font-family: inherit; max-width: 240px; padding: 4px;">
              <span style="font-size: 10px; font-weight: 700; color: #FF4B4B; text-transform: uppercase;">
                ${evt.category}
              </span>
              <h4 style="font-size: 13px; font-weight: 700; color: #09090b; margin: 4px 0; line-height: 1.3;">
                ${evt.title}
              </h4>
              <p style="font-size: 11px; color: #71717a; margin-bottom: 6px;">
                📍 ${evt.venueName}, ${evt.city}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f4f4f5; padding-top: 6px;">
                <span style="font-size: 12px; font-weight: 700; color: #09090b;">
                  ${evt.isFree ? 'FREE' : `₹${evt.price}`}
                </span>
                <a href="/events/${evt.id}" style="font-size: 11px; font-weight: 600; color: #FF4B4B; text-decoration: none;">
                  View Event →
                </a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('click', () => {
            if (onSelectEvent) {
              onSelectEvent(evt.id);
            }
          });

          markersRef.current[evt.id] = marker;
        });

        if (isMounted) {
          setMapLoaded(true);
        }
      } catch (err: any) {
        console.warn('Leaflet map initialization warning:', err);
        if (isMounted) {
          setLoadError(err.message || 'Map view unavailable');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [centerLat, centerLng, zoom, mappedEvents.length]);

  // Handle selected event pan
  useEffect(() => {
    if (selectedEventId && markersRef.current[selectedEventId] && mapInstanceRef.current) {
      const marker = markersRef.current[selectedEventId];
      marker.openPopup();
      mapInstanceRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [selectedEventId]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner">
      
      {/* Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />

      {/* Loading state indicator */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-20">
          <Navigation className="w-8 h-8 text-rose-500 animate-spin mb-2" />
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Plotting hyperlocal coordinates across Delhi NCR...
          </p>
        </div>
      )}

      {/* Informative fallback if Leaflet fails */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 z-20 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
            OpenStreetMap View
          </p>
          <p className="text-xs text-zinc-500 max-w-sm mb-4">
            Interactive map rendering fallback. Showing all {mappedEvents.length} active event locations across Delhi NCR below.
          </p>
          <div className="flex flex-wrap gap-2 max-w-md justify-center">
            {mappedEvents.slice(0, 6).map((evt) => (
              <Link
                key={evt.id}
                href={`/events/${evt.id}`}
                className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-rose-500 text-zinc-800 dark:text-zinc-200"
              >
                📍 {evt.venueName} ({evt.city})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Active Venue</span>
        </span>
        <span>•</span>
        <span>{mappedEvents.length} Venues on Map</span>
      </div>

    </div>
  );
}
