import type { TeamSettings, SeasonPhase, TeamLevel } from '../types/teamSettings';
import { DEFAULT_TEAM_SETTINGS } from '../types/teamSettings';

const STORAGE_KEY = 'rhinos_team_settings';

/**
 * Get current team settings
 */
export function getTeamSettings(): TeamSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading team settings:', error);
  }
  return DEFAULT_TEAM_SETTINGS;
}

/**
 * Update team settings
 */
export function updateTeamSettings(
  seasonPhase: SeasonPhase,
  teamLevel: TeamLevel,
  updatedBy: string
): TeamSettings {
  const settings: TeamSettings = {
    seasonPhase,
    teamLevel,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  return settings;
}

/**
 * Get season phase display name
 */
export function getSeasonPhaseLabel(phase: SeasonPhase): string {
  switch (phase) {
    case 'off-season':
      return 'Off-Season';
    case 'pre-season':
      return 'Pre-Season';
    case 'in-season':
      return 'In-Season';
    case 'post-season':
      return 'Post-Season';
    default:
      return phase;
  }
}

/**
 * Get team level display name
 */
export function getTeamLevelLabel(level: TeamLevel): string {
  switch (level) {
    case 'amateur':
      return 'Amateur';
    case 'semi-pro':
      return 'Semi-Pro';
    case 'college':
      return 'College';
    case 'pro':
      return 'Professional';
    default:
      return level;
  }
}

/**
 * Get season phase description for AI context
 */
export function getSeasonPhaseDescription(phase: SeasonPhase): string {
  switch (phase) {
    case 'off-season':
      return 'Building phase: Focus on strength, power, and conditioning base. Higher volume, longer sessions acceptable.';
    case 'pre-season':
      return 'Preparation phase: Peak conditioning, sport-specific work, team integration. Moderate-high volume.';
    case 'in-season':
      return 'Maintenance phase: Preserve performance, manage fatigue, prioritize recovery. Lower volume, higher intensity.';
    case 'post-season':
      return 'Recovery phase: Active recovery, address injuries, light training. Low volume and intensity.';
    default:
      return '';
  }
}

/**
 * Get team level description for AI context
 */
export function getTeamLevelDescription(level: TeamLevel): string {
  switch (level) {
    case 'amateur':
      return 'Amateur level: Recreational/hobby sport, limited training time, focus on enjoyment and fitness.';
    case 'semi-pro':
      return 'Semi-professional level: Competitive standards, part-time training, balance with work/life commitments.';
    case 'college':
      return 'College level: NCAA/university standards, structured training programs, competitive athletics with academic balance.';
    case 'pro':
      return 'Professional level: Elite standards, full-time training, high expectations for performance and professionalism.';
    default:
      return '';
  }
}
