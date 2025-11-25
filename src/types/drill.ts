export type DrillDifficulty = 'basic' | 'advanced' | 'complex';

// Type for creating a new drill (excluding backend-generated fields)
export type CreateDrillData = {
  name: string;
  category: string; // Now accepts any category key from DrillCategory
  equipment: DrillEquipment[];
  coaches: number;
  dummies: number;
  players: number;
  difficulty: DrillDifficulty;
  description: string;
  coachingPoints: string;
  trainingContext?: string;
  sketchUrl?: string;
  sketchPublicId?: string;
  videoUrl?: string; // YouTube video URL for demonstration
  imageUrl?: string; // Cloudinary URL for drill thumbnail
  imagePublicId?: string; // Cloudinary public_id for deletion
};

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
  category: string; // Now references DrillCategory.key from database
  equipment: DrillEquipment[]; // Array of equipment with quantities
  coaches: number; // Number of coaches needed
  dummies: number; // Number of dummies needed
  players: number; // Number of players needed
  difficulty: DrillDifficulty;
  sketchUrl?: string; // URL to uploaded image/sketch
  sketchPublicId?: string; // Cloudinary public_id for deletion
  videoUrl?: string; // YouTube video URL for demonstration
  imageUrl?: string; // Cloudinary URL for drill thumbnail
  imagePublicId?: string; // Cloudinary public_id for image deletion
  description: string;
  coachingPoints: string;
  trainingContext?: string; // Optional (Warm-up, Individual, Team Period, etc.)
  createdAt: number | Date;
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
