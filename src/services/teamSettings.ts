import type { TeamSettings, SeasonPhase, TeamLevel, TeamCategory, TeamBranding } from '../types/teamSettings';
import { DEFAULT_TEAM_SETTINGS, DEFAULT_TEAM_BRANDING } from '../types/teamSettings';
import { teamSettingsService as teamSettingsApi } from './api';
import { isOnline } from './sync';

const STORAGE_KEY = 'rhinos_team_settings';

// ========================================
// SYNC FUNCTIONS
// ========================================

/**
 * Sync team settings from backend
 */
export async function syncTeamSettingsFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping team settings sync');
    return;
  }

  try {
    console.log('🔄 Syncing team settings from backend...');
    const backendSettings = await teamSettingsApi.get();

    // Convert backend format to frontend format
    const settings: TeamSettings = {
      seasonPhase: backendSettings.seasonPhase as SeasonPhase,
      teamLevel: backendSettings.teamLevel as TeamLevel,
      teamCategory: backendSettings.teamCategory as TeamCategory,
      aiApiKey: backendSettings.aiApiKey,
      branding: {
        teamName: backendSettings.teamName,
        appName: backendSettings.appName || 'Rhinos Training',
        logoUrl: backendSettings.logoUrl,
        faviconUrl: backendSettings.faviconUrl,
        primaryColor: backendSettings.primaryColor,
        secondaryColor: backendSettings.secondaryColor,
      },
      updatedAt: backendSettings.updatedAt,
      updatedBy: backendSettings.updatedBy,
    };

    // Save in localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    console.log('✅ Team settings synced successfully');

    // Apply branding changes
    if (settings.branding) {
      if (settings.branding.faviconUrl) {
        updateFavicon(settings.branding.faviconUrl);
      }
      if (settings.branding.appName) {
        document.title = settings.branding.appName;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to sync team settings:', error);
  }
}

/**
 * Get current team settings (from cache)
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
 * Update team settings (with backend sync)
 */
export async function updateTeamSettings(
  seasonPhase: SeasonPhase,
  teamLevel: TeamLevel,
  teamCategory: TeamCategory,
  updatedBy?: string
): Promise<TeamSettings> {
  if (isOnline()) {
    try {
      const backendSettings = await teamSettingsApi.update({
        seasonPhase,
        teamLevel,
        teamCategory,
      });

      // Sync to update cache
      await syncTeamSettingsFromBackend();

      return getTeamSettings();
    } catch (error) {
      console.error('Failed to update team settings on backend:', error);
      throw error;
    }
  } else {
    throw new Error('Cannot update team settings while offline');
  }
}

/**
 * Get team branding configuration
 */
export function getTeamBranding(): TeamBranding {
  const settings = getTeamSettings();
  return settings.branding || DEFAULT_TEAM_BRANDING;
}

/**
 * Update team branding (with backend sync)
 */
export async function updateTeamBranding(
  branding: Partial<TeamBranding>,
  updatedBy?: string
): Promise<TeamSettings> {
  if (isOnline()) {
    try {
      const updateData: any = {};

      if (branding.teamName) updateData.teamName = branding.teamName;
      if (branding.appName) updateData.appName = branding.appName;
      if (branding.primaryColor) updateData.primaryColor = branding.primaryColor;
      if (branding.secondaryColor) updateData.secondaryColor = branding.secondaryColor;

      await teamSettingsApi.update(updateData);

      // Sync to update cache
      await syncTeamSettingsFromBackend();

      return getTeamSettings();
    } catch (error) {
      console.error('Failed to update team branding on backend:', error);
      throw error;
    }
  } else {
    throw new Error('Cannot update team branding while offline');
  }
}

/**
 * Upload team logo
 */
export async function uploadTeamLogo(file: File): Promise<string> {
  if (isOnline()) {
    try {
      const result = await teamSettingsApi.uploadLogo(file);

      // Sync to update cache
      await syncTeamSettingsFromBackend();

      return result.logoUrl;
    } catch (error) {
      console.error('Failed to upload team logo:', error);
      throw error;
    }
  } else {
    throw new Error('Cannot upload logo while offline');
  }
}

/**
 * Upload favicon
 */
export async function uploadFavicon(file: File): Promise<string> {
  if (isOnline()) {
    try {
      const result = await teamSettingsApi.uploadFavicon(file);

      // Sync to update cache
      await syncTeamSettingsFromBackend();

      // Apply favicon immediately
      updateFavicon(result.faviconUrl);

      return result.faviconUrl;
    } catch (error) {
      console.error('Failed to upload favicon:', error);
      throw error;
    }
  } else {
    throw new Error('Cannot upload favicon while offline');
  }
}

/**
 * Update favicon dynamically
 */
function updateFavicon(faviconUrl: string) {
  const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = faviconUrl;
  document.getElementsByTagName('head')[0].appendChild(link);
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
    case 'pro':
      return 'Professional';
    case 'youth':
      return 'Youth';
    case 'recreational':
      return 'Recreational';
    default:
      return level;
  }
}

/**
 * Get team category display name
 */
export function getTeamCategoryLabel(category: TeamCategory): string {
  switch (category) {
    case 'juvenil':
      return 'Juvenil';
    case 'principal':
      return 'Principal';
    case 'reserves':
      return 'Reserves';
    case 'academy':
      return 'Academy';
    default:
      return category;
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
    case 'pro':
      return 'Professional level: Elite standards, full-time training, high expectations for performance and professionalism.';
    case 'youth':
      return 'Youth level: Focus on development, age-appropriate training, long-term athlete development.';
    case 'recreational':
      return 'Recreational level: Casual participation, social focus, flexible training schedule.';
    default:
      return '';
  }
}

/**
 * Get team category description for AI context
 */
export function getTeamCategoryDescription(category: TeamCategory): string {
  switch (category) {
    case 'juvenil':
      return 'Juvenil: Youth/Junior team, focus on player development and age-appropriate training.';
    case 'principal':
      return 'Principal: First team/Main squad, highest competitive level within the club.';
    case 'reserves':
      return 'Reserves: Reserve/Second team, competitive development pathway to first team.';
    case 'academy':
      return 'Academy: Development squad, focus on fundamental skills and long-term player development.';
    default:
      return '';
  }
}
