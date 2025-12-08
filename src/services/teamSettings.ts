import type { TeamSettings, SeasonPhase, TeamLevel, TeamCategory, TeamBranding } from '../types/teamSettings';
import { DEFAULT_TEAM_SETTINGS, DEFAULT_TEAM_BRANDING } from '../types/teamSettings';
import { teamSettingsService as teamSettingsApi } from './api';

const STORAGE_KEY = 'rhinos_team_settings';

// ========================================
// SYNC FUNCTIONS
// ========================================

/**
 * Sync team settings from backend
 */
export async function syncTeamSettingsFromBackend(): Promise<void> {
  try {
    console.log('🔄 Syncing team settings from backend...');
    const backendSettings = await teamSettingsApi.get();

    // Convert backend format to frontend format
    const branding: TeamBranding = {
      teamName: backendSettings.teamName,
      appName: backendSettings.appName || 'TeamTrainer',
      logoUrl: backendSettings.logoUrl,
      faviconUrl: backendSettings.faviconUrl,
      primaryColor: backendSettings.primaryColor,
      secondaryColor: backendSettings.secondaryColor,
    };

    const settings: TeamSettings = {
      seasonPhase: backendSettings.seasonPhase as SeasonPhase,
      teamLevel: backendSettings.teamLevel as TeamLevel,
      teamCategory: backendSettings.teamCategory as TeamCategory,
      aiApiKey: backendSettings.aiApiKey,
      allowedCategories: Array.isArray(backendSettings.allowedCategories)
        ? backendSettings.allowedCategories
        : [],
      branding,
      updatedAt: backendSettings.updatedAt,
      updatedBy: backendSettings.updatedBy,
    };

    // Save in localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // Also update dedicated branding cache for instant theme loading
    cacheBranding(branding);

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
}

// Separate cache key for branding (used for instant theme loading)
const BRANDING_CACHE_KEY = 'teamtrainer_branding_cache';

/**
 * Get cached branding for instant theme loading (no flash)
 * This is called synchronously before React renders to avoid theme flash
 */
export function getCachedBranding(): TeamBranding {
  try {
    // First try dedicated branding cache
    const brandingCache = localStorage.getItem(BRANDING_CACHE_KEY);
    if (brandingCache) {
      return JSON.parse(brandingCache);
    }
    // Fall back to team settings cache
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.branding) {
        return settings.branding;
      }
    }
  } catch (error) {
    console.error('Error loading cached branding:', error);
  }
  return DEFAULT_TEAM_BRANDING;
}

/**
 * Save branding to dedicated cache (for instant loading on refresh)
 */
export function cacheBranding(branding: TeamBranding): void {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch (error) {
    console.error('Error caching branding:', error);
  }
}

/**
 * Get team branding configuration (from cache - for sync contexts)
 */
export function getTeamBranding(): TeamBranding {
  const settings = getTeamSettings();
  return settings.branding || DEFAULT_TEAM_BRANDING;
}

/**
 * Get team branding configuration directly from database (async)
 * Uses public endpoint - no auth required (works on login page)
 * Falls back to cache if offline
 */
export async function getTeamBrandingAsync(): Promise<TeamBranding> {
  try {
    // Use public branding endpoint (no auth required)
    const branding = await teamSettingsApi.getBranding();
    return {
      teamName: branding.teamName,
      appName: branding.appName || 'TeamTrainer',
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
    };
  } catch (error) {
    console.warn('Failed to fetch team branding from database, using cache:', error);
    return getTeamBranding();
  }
}

/**
 * Update team branding (with backend sync)
 */
export async function updateTeamBranding(
  branding: Partial<TeamBranding>,
  updatedBy?: string
): Promise<TeamSettings> {
  try {
    const updateData: any = {};

    if (branding.teamName) updateData.teamName = branding.teamName;
    if (branding.appName) updateData.appName = branding.appName;
    if (branding.primaryColor) updateData.primaryColor = branding.primaryColor;
    if (branding.secondaryColor) updateData.secondaryColor = branding.secondaryColor;
    // Also save logoUrl and faviconUrl if provided (must be string, not null)
    if (branding.logoUrl) updateData.logoUrl = branding.logoUrl;
    if (branding.faviconUrl) updateData.faviconUrl = branding.faviconUrl;

    await teamSettingsApi.update(updateData);

    // Sync to update cache
    await syncTeamSettingsFromBackend();

    return getTeamSettings();
  } catch (error) {
    console.error('Failed to update team branding on backend:', error);
    throw error;
  }
}

/**
 * Update age categories (with backend sync)
 */
export async function updateAgeCategories(categories: string[]): Promise<TeamSettings> {
  try {
    await teamSettingsApi.update({
      allowedCategories: categories,
    });

    // Sync to update cache
    await syncTeamSettingsFromBackend();

    return getTeamSettings();
  } catch (error) {
    console.error('Failed to update age categories on backend:', error);
    throw error;
  }
}

/**
 * Upload team logo
 */
export async function uploadTeamLogo(file: File): Promise<string> {
  try {
    const result = await teamSettingsApi.uploadLogo(file);

    // Sync to update cache
    await syncTeamSettingsFromBackend();

    return result.logoUrl;
  } catch (error) {
    console.error('Failed to upload team logo:', error);
    throw error;
  }
}

/**
 * Upload favicon
 */
export async function uploadFavicon(file: File): Promise<string> {
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
