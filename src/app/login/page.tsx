'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Radio, Eye, EyeOff, GraduationCap, Building2, ArrowRight, Shield } from 'lucide-react';
import { useUser } from '@/lib/context/UserContext';

const DEMO_ACCOUNTS = {
  candidate: {
    email: 'aarav@nearvibe.in',
    password: 'candidate123',
    name: 'Aarav Sharma',
    role: 'attendee' as const,
  },
  organizer: {
    email: 'techhub@nearvibe.in',
    password: 'organizer123',
    name: 'TechHub NCR',
    role: 'organizer' as const,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggedIn } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'candidate' | 'organizer'>('candidate');

  // Redirect if already logged in
  if (isLoggedIn) {
    router.push('/');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const account = DEMO_ACCOUNTS[selectedTab];
    if (email === account.email && password === account.password) {
      login(account.role);
      router.push('/');
    } else {
      setError('Invalid email or password. You can use the quick demo access buttons below.');
    }
  };

  const handleQuickLogin = (type: 'candidate' | 'organizer') => {
    const account = DEMO_ACCOUNTS[type];
    login(account.role);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-rose-500/8 dark:bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-violet-500/8 dark:bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-500/5 dark:bg-rose-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
                <Radio className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Near<span className="text-rose-600 dark:text-rose-500">Vibe</span>
                </h1>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tracking-wider uppercase font-medium">
                  Hyperlocal Events &bull; Delhi NCR
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
              Sign in to discover, attend, and organize local events.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 overflow-hidden">
            
            {/* Role Tab Switcher */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => { setSelectedTab('candidate'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
                  selectedTab === 'candidate'
                    ? 'text-rose-600 dark:text-rose-400 border-b-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Candidate</span>
              </button>
              <button
                onClick={() => { setSelectedTab('organizer'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${
                  selectedTab === 'organizer'
                    ? 'text-violet-600 dark:text-violet-400 border-b-2 border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Organizer</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Standard Clean Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    selectedTab === 'candidate'
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 shadow-rose-500/25'
                      : 'bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-600 shadow-violet-500/25'
                  }`}
                >
                  <span>Sign In as {selectedTab === 'candidate' ? 'Candidate' : 'Organizer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-400 font-medium">demo evaluation accounts</span>
                </div>
              </div>

              {/* Quick Demo Buttons at the END */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickLogin('candidate')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 dark:hover:border-rose-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all group"
                  >
                    <GraduationCap className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      Candidate Demo
                    </span>
                    <span className="text-[10px] text-zinc-400">Aarav &bull; 1-click</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('organizer')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all group"
                  >
                    <Building2 className="w-5 h-5 text-violet-500" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      Organizer Demo
                    </span>
                    <span className="text-[10px] text-zinc-400">TechHub &bull; 1-click</span>
                  </button>
                </div>

                {/* Demo Credentials Info */}
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    <span>Credentials Reference</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Candidate</p>
                      <p className="text-zinc-500 truncate">{DEMO_ACCOUNTS.candidate.email}</p>
                      <p className="text-zinc-500 font-mono text-[10px]">{DEMO_ACCOUNTS.candidate.password}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">Organizer</p>
                      <p className="text-zinc-500 truncate">{DEMO_ACCOUNTS.organizer.email}</p>
                      <p className="text-zinc-500 font-mono text-[10px]">{DEMO_ACCOUNTS.organizer.password}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
            NearVibe &bull; Hyperlocal Event Discovery &amp; Community Engagement
          </p>
        </div>
      </div>
    </div>
  );
}
