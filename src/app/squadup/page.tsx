'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Plus,
  Filter,
  ArrowRight,
  Code2,
  Briefcase,
  Search,
  Check,
  Layers,
} from 'lucide-react';
import { SquadTeam, SquadProfile, SquadJoinRequest, EventItem } from '@/types';
import { useUser } from '@/lib/context/UserContext';
import { useToast } from '@/lib/context/ToastContext';
import { calculateSquadMatchScore } from '@/lib/utils/squadMatcher';

const AVAILABLE_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'AI/ML Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Mobile Developer (React Native / Flutter)',
  'Blockchain / Web3 Engineer',
  'Pitch / Presenter',
];

const COMMON_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'Python',
  'FastAPI',
  'TailwindCSS',
  'PyTorch',
  'Node.js',
  'PostgreSQL',
  'Figma',
  'Docker',
];

export default function SquadUpPage() {
  const { currentUser } = useUser();
  const { addToast } = useToast();

  const [teams, setTeams] = useState<SquadTeam[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<SquadProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedTeamToJoin, setSelectedTeamToJoin] = useState<SquadTeam | null>(null);

  // Create team form
  const [newTeamEventId, setNewTeamEventId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newTeamRoles, setNewTeamRoles] = useState<string[]>([]);
  const [newTeamMaxMembers, setNewTeamMaxMembers] = useState(4);
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Join request form
  const [joinRole, setJoinRole] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // Profile edit form
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [profileRoles, setProfileRoles] = useState<string[]>([]);
  const [profileBio, setProfileBio] = useState('');
  const [profileExp, setProfileExp] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Teams
      const tRes = await fetch('/api/squad/teams');
      const tData = await tRes.json();
      if (tData.success && tData.teams) {
        setTeams(tData.teams);
      }

      // 2. Fetch Events for dropdown
      const eRes = await fetch('/api/events');
      const eData = await eRes.json();
      if (eData.success && eData.events) {
        setEvents(eData.events);
        if (eData.events.length > 0) {
          setNewTeamEventId(eData.events[0].id);
        }
      }

      // 3. Fetch User's Squad Profile
      if (currentUser?.id) {
        const pRes = await fetch(`/api/squad/profile?userId=${currentUser.id}`);
        const pData = await pRes.json();
        if (pData.success && pData.profile) {
          setProfile(pData.profile);
          setProfileSkills(pData.profile.skills || []);
          setProfileRoles(pData.profile.preferredRoles || []);
          setProfileBio(pData.profile.bio || '');
          setProfileExp(pData.profile.experienceLevel || 'intermediate');
        } else {
          // Initialize default from currentUser
          const defaultSkills = currentUser.interests?.length ? currentUser.interests : ['React', 'TypeScript'];
          setProfileSkills(defaultSkills);
          setProfileRoles(['Frontend Developer']);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SquadUp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  // Handle Save Profile
  const handleSaveProfile = async () => {
    if (!currentUser?.id) return;
    setSavingProfile(true);
    try {
      const payload: Partial<SquadProfile> = {
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatarUrl,
        bio: profileBio,
        skills: profileSkills,
        preferredRoles: profileRoles,
        experienceLevel: profileExp,
        collaborationStyle: 'flexible',
      };

      const res = await fetch('/api/squad/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setShowProfileModal(false);
        addToast('Squad profile updated!', 'success');
      } else {
        throw new Error(data.error || 'Failed to save profile');
      }
    } catch (err: any) {
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      addToast('Please enter a team name', 'error');
      return;
    }
    if (newTeamRoles.length === 0) {
      addToast('Please select at least one required role', 'error');
      return;
    }

    const matchedEvent = events.find((ev) => ev.id === newTeamEventId);
    setCreatingTeam(true);

    try {
      const res = await fetch('/api/squad/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: newTeamEventId,
          eventTitle: matchedEvent?.title || 'Hackathon / Event',
          name: newTeamName.trim(),
          description: newTeamDescription.trim(),
          leaderId: currentUser.id,
          leaderName: currentUser.name,
          leaderAvatar: currentUser.avatarUrl,
          requiredRoles: newTeamRoles,
          maxMembers: newTeamMaxMembers,
        }),
      });

      const data = await res.json();
      if (data.success && data.team) {
        setTeams((prev) => [data.team, ...prev]);
        setShowCreateTeamModal(false);
        setNewTeamName('');
        setNewTeamDescription('');
        setNewTeamRoles([]);
        addToast('Squad team created! Now recruiting members.', 'success');
      } else {
        throw new Error(data.error || 'Failed to create team');
      }
    } catch (err: any) {
      addToast(err.message || 'Error creating team', 'error');
    } finally {
      setCreatingTeam(false);
    }
  };

  // Handle Open Join Modal
  const openJoinModal = (team: SquadTeam) => {
    setSelectedTeamToJoin(team);
    // Auto-select first required role
    setJoinRole(team.requiredRoles[0] || 'Frontend Developer');
    setJoinMessage(`Hi! I'd love to join ${team.name} as a ${team.requiredRoles[0] || 'teammate'}.`);
    setShowJoinModal(true);
  };

  // Handle Submit Join Request
  const handleSubmitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamToJoin || !currentUser?.id) return;

    setSubmittingJoin(true);
    try {
      const res = await fetch('/api/squad/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamToJoin.id,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatarUrl,
          role: joinRole,
          message: joinMessage.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowJoinModal(false);
        addToast('Join request sent to team leader!', 'success');
      } else {
        throw new Error(data.error || 'Failed to submit request');
      }
    } catch (err: any) {
      addToast(err.message || 'Error submitting join request', 'error');
    } finally {
      setSubmittingJoin(false);
    }
  };

  // Handle Leader Accept/Reject Request
  const handleUpdateJoinRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch('/api/squad/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          reviewerId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast(`Request ${status}!`, 'success');
        fetchData(); // refresh teams & member counts
      } else {
        throw new Error(data.error || 'Failed to update request');
      }
    } catch (err: any) {
      addToast(err.message || 'Could not update request', 'error');
    }
  };

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    if (selectedRoleFilter !== 'all') {
      const hasRole = t.requiredRoles.some((r) =>
        r.toLowerCase().includes(selectedRoleFilter.toLowerCase())
      );
      if (!hasRole) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = t.name || t.teamName || '';
      const title = t.eventTitle || '';
      const desc = t.description || '';
      return (
        name.toLowerCase().includes(q) ||
        title.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-rose-950 border border-zinc-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>SquadUp Teammate Formation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Find Teammates for Hackathons & Challenges
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Turn event discovery into participation. Match with developers, designers, and founders for upcoming hackathons with transparent skill-compatibility scoring.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create a Squad</span>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-zinc-700 hover:border-zinc-500 bg-zinc-900/60 text-white font-semibold text-xs transition-colors"
            >
              <Code2 className="w-4 h-4 text-rose-400" />
              <span>Edit Teammate Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Match Profile Banner */}
      {profile && (
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">
                {currentUser.name} • {profile.experienceLevel}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.skills.slice(0, 4).map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block">Looking for roles:</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {profile.preferredRoles.join(', ') || 'Any Role'}
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams by hackathon or tech stack..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              selectedRoleFilter === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            All Openings
          </button>
          {['Frontend', 'Backend', 'AI/ML', 'UI/UX', 'Full-Stack'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                selectedRoleFilter === role
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <Users className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            No matching squad teams found
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Be the first to create a squad team for an upcoming hackathon or event and invite teammates!
          </p>
          <button
            onClick={() => setShowCreateTeamModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
          >
            Create Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const match = profile ? calculateSquadMatchScore(team, profile) : null;
            const isFull = (team.currentMembers ?? team.currentMemberCount) >= team.maxMembers;
            const isUserLeader = team.leaderId === currentUser.id;
            const isUserMember = team.members?.some((m) => m.userId === currentUser.id);

            return (
              <div
                key={team.id}
                className="flex flex-col rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-6 space-y-4"
              >
                {/* Event Association Tag */}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/events/${team.eventId}`}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline truncate max-w-[200px]"
                  >
                    {team.eventTitle}
                  </Link>

                  {/* Match Score Badge */}
                  {match && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        match.score >= 70
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                      title={match.explanations.join(' • ')}
                    >
                      {match.score}% Compatibility
                    </span>
                  )}
                </div>

                {/* Team Name & Description */}
                <div>
                  <h3 className="font-extrabold text-base text-zinc-950 dark:text-white">
                    {team.name}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {team.description || 'Looking for passionate teammates to build and win together.'}
                  </p>
                </div>

                {/* Match Reason (Transparent explanation) */}
                {match && match.explanations.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-start gap-1.5 text-[11px] text-rose-700 dark:text-rose-300">
                    <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                    <span>{match.explanations[0]}</span>
                  </div>
                )}

                {/* Required Roles Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Roles Needed:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.requiredRoles.map((role) => (
                      <span
                        key={role}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500">Roster Capacity</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {team.currentMembers ?? team.currentMemberCount} / {team.maxMembers} Members
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(100, ((team.currentMembers ?? team.currentMemberCount) / team.maxMembers) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Leader & Member Avatars */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 overflow-hidden text-xs flex items-center justify-center font-bold">
                      {team.leaderAvatar ? (
                        <img src={team.leaderAvatar} alt={team.leaderName} className="w-full h-full object-cover" />
                      ) : (
                        team.leaderName.charAt(0)
                      )}
                    </div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Led by {team.leaderName}
                    </span>
                  </div>

                  {/* Action Button */}
                  {isUserLeader ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      Team Leader
                    </span>
                  ) : isUserMember ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Member
                    </span>
                  ) : isFull ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                      Team Full
                    </span>
                  ) : (
                    <button
                      onClick={() => openJoinModal(team)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Request to Join</span>
                    </button>
                  )}
                </div>

                {/* Leader Pending Requests Manager */}
                {isUserLeader && team.joinRequests && team.joinRequests.length > 0 && (
                  <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase">
                      Incoming Join Requests ({team.joinRequests.filter((r) => r.status === 'pending').length})
                    </span>
                    {team.joinRequests
                      .filter((r) => r.status === 'pending')
                      .map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between text-xs p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
                        >
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">
                              {req.userName} ({req.role})
                            </p>
                            <p className="text-[10px] text-zinc-400">{req.message}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateJoinRequest(req.id, 'accepted')}
                              className="p-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:scale-105"
                              title="Accept Member"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateJoinRequest(req.id, 'rejected')}
                              className="p-1 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:scale-105"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CREATE SQUAD TEAM */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Create a Squad Team
              </h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Associated Event / Hackathon *
                </label>
                <select
                  value={newTeamEventId}
                  onChange={(e) => setNewTeamEventId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. NeuralVoyagers, VecnaHacks"
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  What are you building? (Description)
                </label>
                <textarea
                  rows={3}
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  placeholder="Briefly describe your project idea or hackathon track..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Required Roles *
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = newTeamRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewTeamRoles(newTeamRoles.filter((r) => r !== role));
                          } else {
                            setNewTeamRoles([...newTeamRoles, role]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300'
                        }`}
                      >
                        {isSelected ? `✓ ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Maximum Team Size (including leader)
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={newTeamMaxMembers}
                  onChange={(e) => setNewTeamMaxMembers(parseInt(e.target.value, 10) || 4)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  {creatingTeam ? 'Creating...' : 'Launch Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST TO JOIN */}
      {showJoinModal && selectedTeamToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Join {selectedTeamToJoin.name}
              </h3>
              <button onClick={() => setShowJoinModal(false)} className="text-zinc-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitJoinRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Which role are you applying for?
                </label>
                <select
                  value={joinRole}
                  onChange={(e) => setJoinRole(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {selectedTeamToJoin.requiredRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Introduction / Skills Pitch
                </label>
                <textarea
                  rows={3}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Share your strengths, relevant portfolio, or why you want to team up..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  {submittingJoin ? 'Sending...' : 'Send Join Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SQUAD PROFILE SETUP */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Teammate Matching Profile
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-zinc-400">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Your Technical Skills & Strengths
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  {COMMON_SKILLS.map((skill) => {
                    const has = profileSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (has) setProfileSkills(profileSkills.filter((s) => s !== skill));
                          else setProfileSkills([...profileSkills, skill]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          has ? 'bg-rose-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {has ? `✓ ${skill}` : `+ ${skill}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Preferred Team Roles
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  {AVAILABLE_ROLES.slice(0, 6).map((role) => {
                    const has = profileRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          if (has) setProfileRoles(profileRoles.filter((r) => r !== role));
                          else setProfileRoles([...profileRoles, role]);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          has ? 'bg-rose-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {has ? `✓ ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Experience Level
                </label>
                <select
                  value={profileExp}
                  onChange={(e) => setProfileExp(e.target.value as any)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="beginner">Beginner (First-time hacker, eager to learn)</option>
                  <option value="intermediate">Intermediate (Built side-projects, hackathon familiar)</option>
                  <option value="advanced">Advanced / Lead (Production experience, competition finalist)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
