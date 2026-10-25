import { SquadProfile, SquadTeam } from '@/types';

export interface SquadMatchResult {
  score: number;
  reason: string;
  matchedRoles: string[];
}

/**
 * Calculates a transparent, explainable match score (0-100) between an attendee profile and a team's openings
 */
export function scoreTeamForMember(
  team: SquadTeam,
  profile?: SquadProfile | null
): SquadMatchResult {
  if (!profile) {
    return {
      score: 20,
      reason: 'Open team recruiting members',
      matchedRoles: [],
    };
  }

  // If team is full or closed
  if (team.status === 'full' || team.currentMemberCount >= team.maxMembers) {
    return {
      score: 0,
      reason: 'Team has reached full member capacity',
      matchedRoles: [],
    };
  }

  let roleScore = 0;
  let skillScore = 0;
  let styleScore = 0;
  const reasons: string[] = [];
  const matchedRoles: string[] = [];

  const profileRolesLower = profile.preferredRoles.map((r) => r.toLowerCase());
  const profileSkillsLower = profile.skills.map((s) => s.toLowerCase());

  // 1. Role Match (Max 50 pts)
  for (const reqRole of team.requiredRoles) {
    if (profileRolesLower.some((pr) => reqRole.toLowerCase().includes(pr) || pr.includes(reqRole.toLowerCase()))) {
      roleScore = 50;
      matchedRoles.push(reqRole);
      reasons.push(`Team needs your preferred role: ${reqRole}`);
      break;
    }
  }

  // 2. Skill Match (Max 30 pts)
  let skillMatches = 0;
  for (const skill of profileSkillsLower) {
    if (team.description.toLowerCase().includes(skill) || team.requiredRoles.some((r) => r.toLowerCase().includes(skill))) {
      skillMatches++;
    }
  }
  if (skillMatches > 0) {
    skillScore = Math.min(30, skillMatches * 15);
    reasons.push(`Skills match team requirements (${skillMatches} matched)`);
  }

  // 3. Collaboration Style Match (Max 20 pts)
  styleScore = 20;

  const totalScore = Math.min(100, roleScore + skillScore + styleScore);
  const displayReason = reasons.length > 0 ? reasons.join(' • ') : 'Open team looking for collaborative builders';
  const memberCount = team.currentMemberCount ?? (team as any).currentMembers ?? 1;

  return {
    score: totalScore,
    reason: `${displayReason} (${memberCount}/${team.maxMembers} filled)`,
    matchedRoles,
  };
}

export function calculateSquadMatchScore(
  team: SquadTeam,
  profile?: SquadProfile | null
): { score: number; explanations: string[]; matchedRoles: string[] } {
  const res = scoreTeamForMember(team, profile);
  return {
    score: res.score,
    explanations: res.reason ? [res.reason] : [],
    matchedRoles: res.matchedRoles,
  };
}
