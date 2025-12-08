/**
 * Season Phase - different training periods throughout the year
 */
export type SeasonPhase =
  | 'off-season'      // Focus on building strength, power, conditioning base
  | 'pre-season'      // Peak conditioning, sport-specific work, team integration
  | 'in-season'       // Maintenance, recovery management, performance
  | 'post-season';    // Active recovery, address injuries, light training

/**
 * Team Level - competitive level of the team
 */
export type TeamLevel =
  | 'amateur'         // Amateur/hobby level, club teams
  | 'semi-pro'        // Semi-professional leagues
  | 'pro'             // Professional league (NFL, European pro leagues)
  | 'youth'           // Youth teams
  | 'recreational';   // Recreational/casual teams

/**
 * Team Category - age/organizational classification
 */
export type TeamCategory =
  | 'juvenil'         // Youth/Junior teams
  | 'principal'       // First team/Main squad
  | 'reserves'        // Reserve/Second team
  | 'academy';        // Academy/Development squad

/**
 * Team branding configuration
 */
export interface TeamBranding {
  teamName?: string;        // Team name (e.g., "Rhinos", "Eagles")
  appName: string;          // Application name (e.g., "TeamTrainer")
  logoUrl?: string;         // Main logo URL/path
  faviconUrl?: string;      // Favicon URL/path
  primaryColor?: string;    // Primary theme color (hex)
  secondaryColor?: string;  // Secondary theme color (hex)
}

/**
 * Team settings configuration
 */
export interface TeamSettings {
  seasonPhase: SeasonPhase;
  teamLevel: TeamLevel;
  teamCategory: TeamCategory;
  aiApiKey?: string;        // Team-wide OpenAI API key (configured by admin)
  branding?: TeamBranding;  // Team branding configuration
  allowedCategories?: string[]; // Age/skill categories for players (e.g., ['U13', 'U15', 'Seniors'])
  updatedAt?: string;
  updatedBy?: string;       // Coach who updated settings
}

/**
 * Default team branding
 */
export const DEFAULT_TEAM_BRANDING: TeamBranding = {
  teamName: 'TeamTrainer',
  appName: 'TeamTrainer',
  logoUrl: '/teamtrainer-logo.svg',
  faviconUrl: '/teamtrainer-logo.svg',
  primaryColor: '#1976d2',  // Default Blue
  secondaryColor: '#ff9800', // Default Orange
};

/**
 * Default team settings
 */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  seasonPhase: 'off-season',
  teamLevel: 'amateur',
  teamCategory: 'principal',
  branding: DEFAULT_TEAM_BRANDING,
  allowedCategories: [],
};
