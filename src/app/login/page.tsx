'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, UserCheck, Layers, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { switchIdentity } = useUser();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      switchIdentity('custom', {
        id: `user-${Date.now().toString(36)}`,
        name: email.split('@')[0],
        email,
        role: 'attendee',
        interests: ['Hackathons', 'Technology', 'AI & ML'],
        preferredCity: 'Noida',
        preferredRadiusKm: 25,
        createdAt: new Date().toISOString(),
      });
      addToast('Signed in successfully', 'success');
      router.push('/');
    }, 600);
  };

  const handleDemoLogin = (role: 'attendee' | 'organizer') => {
    switchIdentity(role);
    router.push(role === 'organizer' ? '/organizer' : '/');
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6 w-full flex-1 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 items-center justify-center text-white shadow-lg shadow-rose-500/25 mb-2">
          <Radio className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
          Welcome to NearVibe
        </h1>
        <p className="text-xs text-zinc-500">
          Discover local hackathons, workshops, and meetups in Delhi NCR
        </p>
      </div>

      {/* 1-Click Demo Identities (For Hackathon Judges) */}
      <div className="rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hackathon Demo Access</span>
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Explore both attendee discovery and organizer management in 1 click:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleDemoLogin('attendee')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-all text-center"
          >
            <UserCheck className="w-5 h-5 text-rose-500 mb-1" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Aarav Sharma
            </span>
            <span className="text-[10px] text-zinc-500">Demo Attendee</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('organizer')}
            className="flex flex-col items-center p-3 rounded-xl bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 hover:shadow-md transition-all text-center"
          >
            <Layers className="w-5 h-5 text-violet-500 mb-1" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              TechHub NCR
            </span>
            <span className="text-[10px] text-zinc-500">Demo Organizer</span>
          </button>
        </div>
      </div>

      {/* Standard Email Login */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
        <form onSubmit={handleCustomLogin} className="space-y-4">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-md transition-all"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2">
          <span>Don&apos;t have an account? </span>
          <Link href="/signup" className="text-rose-600 dark:text-rose-400 font-semibold hover:underline">
            Register now
          </Link>
        </div>
      </div>

    </div>
  );
}
