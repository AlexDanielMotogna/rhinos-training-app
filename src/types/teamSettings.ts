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
  | 'college'         // College level (NCAA, European university leagues)
  | 'pro';            // Professional league (NFL, European pro leagues)

/**
 * Team branding configuration
 */
export interface TeamBranding {
  appName: string;          // Application name (e.g., "Rhinos Training")
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
  aiApiKey?: string;        // Team-wide OpenAI API key (configured by admin)
  branding?: TeamBranding;  // Team branding configuration
  updatedAt?: string;
  updatedBy?: string;       // Coach who updated settings
}

/**
 * Default team branding
 */
export const DEFAULT_TEAM_BRANDING: TeamBranding = {
  appName: 'Rhinos Training',
  logoUrl: '/USR_Allgemein_Quard_Transparent.png',
  primaryColor: '#203731',  // Packers Green
  secondaryColor: '#FFB612', // Packers Gold
};

/**
 * Default team settings
 */
export const DEFAULT_TEAM_SETTINGS: TeamSettings = {
  seasonPhase: 'off-season',
  teamLevel: 'amateur',
  branding: DEFAULT_TEAM_BRANDING,
};
