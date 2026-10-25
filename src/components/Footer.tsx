import React from 'react';
import Link from 'next/link';
import { Radio, Code2, Heart, ShieldCheck, Sparkles, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                <Radio className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                Near<span className="text-rose-600 dark:text-rose-500">Vibe</span>
              </span>
            </Link>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Hyperlocal event discovery & community engagement platform. Connecting students, developers, creators, and organizers across Delhi NCR.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Noida • Gurugram • Delhi • Ghaziabad</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Event Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/discover?category=Hackathons" className="hover:text-rose-500 transition-colors">
                  Hackathons & Coding Sprints
                </Link>
              </li>
              <li>
                <Link href="/discover?category=AI+%26+ML" className="hover:text-rose-500 transition-colors">
                  Generative AI & LLM Workshops
                </Link>
              </li>
              <li>
                <Link href="/discover?category=Technology" className="hover:text-rose-500 transition-colors">
                  Frontend & Open Source
                </Link>
              </li>
              <li>
                <Link href="/discover?category=Startups+%26+Business" className="hover:text-rose-500 transition-colors">
                  Startup Pitching & Angel Mixers
                </Link>
              </li>
              <li>
                <Link href="/discover?category=Design+%26+UI%2FUX" className="hover:text-rose-500 transition-colors">
                  UI/UX & Spatial Design
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Hubs */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Hyperlocal NCR Hubs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/discover?city=Noida" className="hover:text-rose-500 transition-colors">
                  Noida (Sec 62 & Expressway)
                </Link>
              </li>
              <li>
                <Link href="/discover?city=Gurugram" className="hover:text-rose-500 transition-colors">
                  Gurugram (Cyber City & Horizon)
                </Link>
              </li>
              <li>
                <Link href="/discover?city=Delhi" className="hover:text-rose-500 transition-colors">
                  Central & South Delhi
                </Link>
              </li>
              <li>
                <Link href="/discover?city=Ghaziabad" className="hover:text-rose-500 transition-colors">
                  Ghaziabad (Indirapuram)
                </Link>
              </li>
              <li>
                <Link href="/discover?city=Greater+Noida" className="hover:text-rose-500 transition-colors">
                  Greater Noida (Knowledge Park)
                </Link>
              </li>
            </ul>
          </div>

          {/* Organizers & Platform */}
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">
              Organizers & Community
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/organizer" className="hover:text-rose-500 transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
              <li>
                <Link href="/organizer/events/new" className="hover:text-rose-500 transition-colors">
                  Publish New Event
                </Link>
              </li>
              <li>
                <Link href="/saved" className="hover:text-rose-500 transition-colors">
                  Bookmarked Events
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-rose-500 transition-colors">
                  Personalize Recommendations
                </Link>
              </li>
              <li>
                <Link href="/moderation" className="hover:text-rose-500 transition-colors">
                  Community Safety & Review
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span>Built for the National-Level Hackathon with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by Saransh Gupta</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Neon PostgreSQL Powered</span>
            </span>
            <span>•</span>
            <a
              href="https://github.com/Mr-Saransh/NearVibe_Saransh_Gupta.git"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
