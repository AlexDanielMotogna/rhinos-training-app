export type DrillCategory = 'athletik' | 'fundamentals' | 'offense' | 'defense' | 'team' | 'cooldown';

export type DrillDifficulty = 'basic' | 'advanced' | 'complex';

export interface Equipment {
  id: string;
  name: string;
  quantity?: number;
  imageUrl?: string; // URL to uploaded reference image
  createdAt: number;
}

export interface DrillEquipment {
  equipmentId: string;
  quantity: number;
}

export interface Drill {
  id: string;
  name: string;
  category: DrillCategory;
  equipment: DrillEquipment[]; // Array of equipment with quantities
  coaches: number; // Number of coaches needed
  dummies: number; // Number of dummies needed
  players: number; // Number of players needed
  difficulty: DrillDifficulty;
  sketchUrl?: string; // URL to uploaded image/sketch
  description: string;
  coachingPoints: string;
  trainingContext?: string; // Optional (Warm-up, Individual, Team Period, etc.)
  createdAt: number;
  createdBy: string; // Coach user ID
}

export interface DrillTrainingSession {
  id: string;
  name: string;
  date: string;
  drills: string[]; // Array of drill IDs
  notes?: string;
  createdAt: number;
  createdBy: string;
}

// Helper type for displaying drill resources summary
export interface DrillResourceSummary {
  totalEquipment: Map<string, number>; // equipment ID -> total quantity needed
  totalCoaches: number;
  totalDummies: number;
  totalPlayers: number;
}
