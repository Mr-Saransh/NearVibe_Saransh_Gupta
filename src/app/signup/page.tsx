'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

export default function SignupPage() {
  const router = useRouter();
  const { switchIdentity } = useUser();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'attendee' | 'organizer'>('attendee');
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setLoading(true);
    setTimeout(() => {
      switchIdentity('custom', {
        id: `user-${Date.now().toString(36)}`,
        name: name.trim(),
        email: email.trim(),
        role,
        interests: ['Hackathons', 'Technology', 'AI & ML'],
        preferredCity: 'Noida',
        preferredRadiusKm: 25,
        createdAt: new Date().toISOString(),
      });
      addToast('Account created! Let us set your preferences.', 'success');
      router.push('/onboarding');
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6 w-full flex-1 space-y-6">
      
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 items-center justify-center text-white shadow-lg shadow-rose-500/25 mb-2">
          <Radio className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
          Create NearVibe Account
        </h1>
        <p className="text-xs text-zinc-500">
          Join the hyperlocal developer and student community
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aarav Sharma"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('attendee')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === 'attendee'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600'
                }`}
              >
                Attendee / Student
              </button>
              <button
                type="button"
                onClick={() => setRole('organizer')}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  role === 'organizer'
                    ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-500 text-violet-600 dark:text-violet-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-600'
                }`}
              >
                Event Organizer
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all"
          >
            {loading ? 'Creating Account...' : 'Continue to Preferences →'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2">
          <span>Already have an account? </span>
          <Link href="/login" className="text-rose-600 dark:text-rose-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>

    </div>
  );
}
