'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Users,
  Tag,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { EventItem, EventCategory, EventFormat } from '@/types';
import { NCR_CITIES } from '@/lib/utils/geo';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

interface EventFormProps {
  initialData?: EventItem;
  isEditing?: boolean;
}

const PRESET_COVERS = [
  { label: 'Hackathon / Coding', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { label: 'AI & Data Science', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Tech Meetup & Workshop', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Design & UI/UX', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Startup & Mixer', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Music & Arts', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80' },
];

export default function EventForm({ initialData, isEditing = false }: EventFormProps) {
  const router = useRouter();
  const { currentUser } = useUser();
  const { addToast } = useToast();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<EventCategory>(initialData?.category || 'Hackathons');
  const [format, setFormat] = useState<EventFormat>(initialData?.format || 'in-person');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || PRESET_COVERS[0].url);

  // Default dates: tomorrow at 10 AM, ends at 6 PM
  const defaultStart = new Date(Date.now() + 86400000);
  defaultStart.setHours(10, 0, 0, 0);
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(18, 0, 0, 0);

  const [startTime, setStartTime] = useState(
    initialData?.startTime
      ? new Date(initialData.startTime).toISOString().slice(0, 16)
      : defaultStart.toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    initialData?.endTime
      ? new Date(initialData.endTime).toISOString().slice(0, 16)
      : defaultEnd.toISOString().slice(0, 16)
  );

  const [venueName, setVenueName] = useState(initialData?.venueName || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [city, setCity] = useState(initialData?.city || 'Noida');
  const [latitude, setLatitude] = useState<number>(initialData?.latitude || 28.5355);
  const [longitude, setLongitude] = useState<number>(initialData?.longitude || 77.3910);

  const [isFree, setIsFree] = useState(initialData?.isFree ?? true);
  const [price, setPrice] = useState(initialData?.price ? initialData.price.toString() : '0');
  const [capacity, setCapacity] = useState(initialData?.capacity ? initialData.capacity.toString() : '100');
  const [tagsInput, setTagsInput] = useState(initialData?.tags ? initialData.tags.join(', ') : 'Hackathon, AI, Students');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Sync city hub coordinates
  const handleCityChange = (cityName: string) => {
    setCity(cityName);
    const hub = NCR_CITIES.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
    if (hub) {
      setLatitude(hub.latitude);
      setLongitude(hub.longitude);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Event title must be at least 5 characters long';
    }
    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Please provide a descriptive overview (min 20 characters)';
    }
    if (!venueName.trim() && format !== 'online') {
      errs.venueName = 'Venue name is required for in-person and hybrid events';
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errs.date = 'Please provide valid start and end dates';
    } else if (end <= start) {
      errs.date = 'Event end time must be after the start time';
    }

    const capNum = parseInt(capacity, 10);
    if (isNaN(capNum) || capNum < 1) {
      errs.capacity = 'Capacity must be at least 1 spot';
    }

    if (!isFree) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errs.price = 'Paid events must have a price greater than 0';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerAvatar: currentUser.avatarUrl,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArray,
      coverImage,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      format,
      venueName: format === 'online' ? 'NearVibe Virtual Stage' : venueName.trim(),
      address: format === 'online' ? 'Online Discord & Stream' : address.trim() || city,
      city,
      latitude: format === 'online' ? null : latitude,
      longitude: format === 'online' ? null : longitude,
      isFree,
      price: isFree ? 0 : parseFloat(price),
      capacity: parseInt(capacity, 10),
      status: 'published',
    };

    try {
      let res;
      if (isEditing && initialData) {
        res = await fetch(`/api/events/${initialData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        addToast(
          isEditing ? 'Event updated successfully!' : 'Event published live to NearVibe!',
          'success'
        );
        router.push(isEditing ? `/events/${initialData!.id}` : '/organizer');
      } else {
        addToast(data.error || 'Failed to save event', 'error');
      }
    } catch {
      addToast('Network error while saving event', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      
      {/* 1. Basic Info Section */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>Basic Event Information</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Event Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. HackNCR 2026: 36-Hour National Collegiate Hackathon"
            className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Hackathons">Hackathons & Coding Sprints</option>
              <option value="AI & ML">AI & Machine Learning</option>
              <option value="Technology">Technology & Web Dev</option>
              <option value="Startups & Business">Startups & Angel Mixers</option>
              <option value="Design & UI/UX">Design & UI/UX</option>
              <option value="Education & Workshops">Education & Workshops</option>
              <option value="Music & Arts">Music & Arts</option>
              <option value="Community & Social">Community & Social</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Event Format *
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as EventFormat)}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="in-person">In-Person Venue</option>
              <option value="hybrid">Hybrid (Physical + Stream)</option>
              <option value="online">Virtual / Online Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Detailed Description *
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the schedule, tracks, prizes, speaker lineup, and requirements for attendees..."
            className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {errors.description && <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="AI, Hackathon, FullStack, Mentorship"
            className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* 2. Cover Visuals */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-rose-500" />
          <span>Cover Visuals</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
            Select a Preset Visual or Custom Image URL
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {PRESET_COVERS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCoverImage(preset.url)}
                className={`relative aspect-[16/9] rounded-xl overflow-hidden border-2 transition-all ${
                  coverImage === preset.url
                    ? 'border-rose-500 shadow-md ring-2 ring-rose-500/20'
                    : 'border-zinc-200 dark:border-zinc-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 right-1 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded truncate">
                  {preset.label}
                </span>
              </button>
            ))}
          </div>

          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="Or enter custom image URL (Unsplash, Cloudinary, etc.)"
            className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* 3. Schedule & Timing */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-rose-500" />
          <span>Schedule & Date</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
        {errors.date && <p className="text-[11px] text-rose-500">{errors.date}</p>}
      </div>

      {/* 4. Venue & Location */}
      {format !== 'online' && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Venue & Hyperlocal NCR Coordinates</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                NCR City / Hub *
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Noida">Noida (Sector 62 / Expressway)</option>
                <option value="Delhi">Delhi (Central & South)</option>
                <option value="Gurugram">Gurugram (Cyber City & DLF)</option>
                <option value="Ghaziabad">Ghaziabad (Indirapuram)</option>
                <option value="Greater Noida">Greater Noida (Knowledge Park)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Venue Name *
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Amity Innovation Hub Auditorium"
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {errors.venueName && <p className="text-[11px] text-rose-500 mt-1">{errors.venueName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Sector 125, Amity Campus, Noida"
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
            <div>
              <label className="block text-[11px] font-semibold mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. Capacity & Ticketing */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-rose-500" />
          <span>Capacity & Ticketing</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Total Registration Capacity *
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {errors.capacity && <p className="text-[11px] text-rose-500 mt-1">{errors.capacity}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Pricing Model *
            </label>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="priceModel"
                  checked={isFree}
                  onChange={() => setIsFree(true)}
                  className="text-rose-500"
                />
                <span>Free Admission</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="priceModel"
                  checked={!isFree}
                  onChange={() => setIsFree(false)}
                  className="text-rose-500"
                />
                <span>Paid Ticket (₹)</span>
              </label>
            </div>
          </div>
        </div>

        {!isFree && (
          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Ticket Price (INR ₹) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 499"
              className="w-full text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {errors.price && <p className="text-[11px] text-rose-500 mt-1">{errors.price}</p>}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-[1.02]"
        >
          <span>{submitting ? 'Saving Event...' : isEditing ? 'Save Changes' : 'Publish Event Live'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </form>
  );
}
