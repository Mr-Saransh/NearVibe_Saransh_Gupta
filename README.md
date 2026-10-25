# 🌟 NearVibe — Hyperlocal Event Discovery & Community Platform

> **Discover nearby. Connect locally. Build community.**

NearVibe is a production-ready, full-stack hyperlocal event discovery and engagement platform built for the National-Level Hackathon. It solves the fragmentation of college hackathons, technical workshops, founder meetups, and local community gatherings scattered across disconnected WhatsApp groups, Instagram stories, and posters.

---

## ⚡ Core Value Proposition & Key Features

1. **Hyperlocal Discovery Engine (`/discover`)**:
   - Live browser GPS coordinate detection with graceful fallback to manual Delhi NCR city centers.
   - **Haversine Formula**: Calculates real great-circle distance between attendee coordinates and event venues.
   - Proximity radius filtering: 5 km, 10 km, 25 km, 50 km, and 100 km.
   - Dual interface: Grid list view and a **real interactive OpenStreetMap / Leaflet map** with clickable event pins and popups (zero paid API keys required).

2. **Transparent, Explainable Recommendations**:
   - Rule-based transparent scoring algorithm (0–100):
     - **40%** Category & Tag Match with attendee interests.
     - **30%** Proximity Match based on user location.
     - **15%** Date Freshness (events happening soonest score highest).
     - **15%** Community Demand & Fill Ratio (`registeredCount / capacity`).
   - Every recommendation is accompanied by an explainable, data-backed badge (e.g., *"Matches your interest in AI & ML • 4.2 km away"*).

3. **State-Changing Registrations & Capacity Management**:
   - Real state-changing operation with capacity enforcement (prevents overbooking / "Sold Out" state).
   - Duplicate registration prevention with database constraints.
   - Add-to-Calendar export: Generates downloadable RFC 5545 compliant `.ics` calendar files and one-click Google Calendar web links.
   - Instant registration cancellation with confirmation dialogs.
   - Celebration confetti animation on confirmed booking.

4. **Event Organizer Experience (`/organizer`)**:
   - Organizer Dashboard with real stored data metrics: Total Events, Total Registrations, Upcoming Events, and Average Capacity Fill %.
   - Full event creation and editing forms with Zod-style validation, start/end time validation, preset NCR coordinate hubs, cover image presets, and ticket pricing.
   - Secure ownership checks: Organizers can only edit or cancel events they own.

5. **Community Engagement & Safety**:
   - Interactive Q&A discussion board on every event details page.
   - Native Web Share API with clipboard fallback and social sharing shortcuts.
   - Listing reporting system with a dedicated moderation review desk (`/moderation`).

6. **Dual Data Architecture (Neon PostgreSQL + Demo Mode)**:
   - **Production Mode**: Connects directly to serverless **Neon PostgreSQL** with relational foreign keys, constraints, and query indexes.
   - **Persistent Demo Mode**: When offline or if DB credentials are unavailable, seamlessly switches to a localStorage-backed demo adapter so all registrations, bookmarks, comments, and created events survive page refreshes.

---

## 🏗️ Architecture & Technical Stack

```
NearVibe Architecture
├── Frontend (Next.js 16 App Router + React 19)
│   ├── src/app/ (Pages: /, /discover, /events/[id], /saved, /organizer, /onboarding, /profile, /moderation)
│   ├── src/components/ (Navbar, EventCard, InteractiveMap, EventForm, Modals)
│   └── src/lib/context/ (UserContext, ToastContext)
│
├── Business Logic & Utilities
│   ├── src/lib/utils/geo.ts (Haversine formula & NCR hubs)
│   ├── src/lib/utils/recommendations.ts (Scoring engine)
│   ├── src/lib/utils/calendar.ts (RFC 5545 .ics & Google Cal)
│   └── src/lib/utils/date.ts (Human-friendly date formatters)
│
├── Data Access Layer (Repository Pattern)
│   ├── src/lib/repository/types.ts (IEventRepository interface)
│   ├── src/lib/repository/postgresRepository.ts (Neon PostgreSQL driver)
│   └── src/lib/repository/demoRepository.ts (Persistent local adapter)
│
└── Database (PostgreSQL / Neon)
    ├── src/lib/db/schema.sql (DDL schema with indexes)
    ├── src/lib/db/seed.ts (13+ realistic NCR events)
    └── src/lib/db/index.ts (Connection pooling)
```

- **Framework**: Next.js 16.4.3 (App Router)
- **Language**: TypeScript 5 (Strict type checking)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **Database**: PostgreSQL (Neon Serverless Pooler)
- **Icons**: Lucide React
- **Mapping**: Leaflet 1.9 + OpenStreetMap
- **Testing**: Node Native Test Runner via `tsx`

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.17+ or v20+ or v24+
- **npm**: v9+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Mr-Saransh/NearVibe_Saransh_Gupta.git
cd NearVibe
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `DATABASE_URL` is configured:
```env
DATABASE_URL="postgresql://neondb_owner:npg_B6i5NkSJtpgU@ep-crimson-lab-b5t4pk5j-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_ENABLE_DEMO_MODE="false"
```

### 3. Initialize & Seed Neon Database
To automatically execute the SQL schema and populate the 13+ realistic Delhi NCR events:
```bash
npm run db:seed
```

### 4. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Run Automated Tests
Execute the 12 unit tests validating Haversine distance calculations, recommendation scoring, capacity limits, and iCalendar generation:
```bash
npm run test
```

### 6. Build for Production
```bash
npm run build
npm run start
```

---

## 🎯 Demo Walkthrough Guide for Hackathon Judges

NearVibe includes a **1-click Persona Switcher** located in the top navigation bar. Judges can experience both sides of the platform immediately:

### A. Attendee Journey (Aarav Sharma — Student & Builder)
1. **Homepage Discovery (`/`)**:
   - Observe the live badge in the header indicating **Neon DB** connectivity.
   - Review the personalized feed tailored to Aarav's interests in *AI & Hackathons*.
   - Click the **"Use My GPS"** button to detect your coordinates, or select a city hub (Noida, Gurugram, Delhi, Ghaziabad).
2. **Interactive Map Exploration (`/discover`)**:
   - Filter by **Hackathons** or **AI & ML**.
   - Move the radius slider (e.g., 25 km) to see Haversine distance calculations update in real time.
   - Click markers on the interactive OpenStreetMap to view venue popups.
3. **Event Registration (`/events/evt-001`)**:
   - Open **HackNCR 2026** details.
   - Click **"Register Now"**: Enjoy the confetti celebration and watch the capacity meter update dynamically.
   - Click **"Download .ICS"** to export the event to your Apple/Outlook calendar, or click **"Google Cal"** to open a pre-filled Google Calendar tab.
   - Post a question in the Community Discussion section.
4. **Saved & Registrations Dashboard (`/saved`)**:
   - Toggle bookmarks on any event card.
   - Switch between **Saved Bookmarks** and **My Registrations** to view active participation.

### B. Organizer Journey (TechHub NCR — Community Lead)
1. **Instant Persona Switch**:
   - In the top right corner, click on Aarav's profile dropdown and select **"TechHub NCR (Organizer)"**.
2. **Organizer Dashboard (`/organizer`)**:
   - Review live metric cards: Total Events, Total Registrations, Upcoming Events, and Average Capacity Fill %.
   - Inspect the managed events table with fill percentages.
3. **Publishing a New Event (`/organizer/events/new`)**:
   - Fill out title, category, select a preset cover image, and set date & venue.
   - Choose an NCR city hub (auto-populates accurate coordinates).
   - Submit: The event immediately appears live across `/`, `/discover`, and the interactive map!
4. **Community Moderation Desk (`/moderation`)**:
   - Review reported event listings to keep the community safe.

---

## 🛡️ Database Schema Overview

The relational PostgreSQL schema includes:
- `profiles`: User identities, roles, preferred city, radius, and interest arrays.
- `events`: Comprehensive metadata, coordinates, capacity, pricing, and publication status.
- `registrations`: Active attendee bookings with `UNIQUE(event_id, user_id)` constraint.
- `saved_events`: Bookmarked listings per user.
- `event_comments`: Community discussion threads with author references.
- `event_reports`: Moderation logs with review statuses (`pending`, `reviewed`, `dismissed`).

---

## 🏆 Hackathon Submission Verification Summary

| Test / Criterion | Result | Description |
|---|---|---|
| **TypeScript Compilation** | ✅ Pass | Zero type errors across all routes & components |
| **Next.js Production Build** | ✅ Pass | All 20 routes and API handlers statically & dynamically generated |
| **Automated Unit Tests** | ✅ 12/12 Pass | Haversine distance, recommendation scoring, and RFC 5545 .ics generation |
| **Neon PostgreSQL** | ✅ Connected | Tables migrated, indexed, and seeded with 13 NCR events |
| **Local Persistence** | ✅ Verified | Demo mode fallback preserves state across reloads |
| **Mobile Responsiveness** | ✅ Verified | Clean layouts, touch targets, and mobile bottom navigation |

---

*NearVibe — Built for the National-Level Hackathon by Saransh Gupta.*
