import { Drill, DrillResourceSummary, CreateDrillData } from '../types/drill';
import { drillService as drillApi } from './api';

const DRILLS_STORAGE_KEY = 'rhinos_drills';

// ========================================
// SYNC FUNCTIONS
// ========================================

export async function syncDrillsFromBackend(): Promise<void> {
  try {
    console.log('🔄 Syncing drills from backend...');
    const backendDrills = await drillApi.getAll() as any[];

    // Normalize drill data - ensure equipment is always an array
    const normalizedDrills = backendDrills.map((drill: any) => ({
      ...drill,
      equipment: Array.isArray(drill.equipment)
        ? drill.equipment
        : (typeof drill.equipment === 'string'
          ? JSON.parse(drill.equipment)
          : []),
    }));

    // Save in localStorage as cache
    localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(normalizedDrills));
    console.log(`✅ Drills synced successfully (${normalizedDrills.length} drills)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync drills:', error);
  }
}

// ========================================
// LOCAL STORAGE FUNCTIONS (Cache + Offline)
// ========================================

export const drillService = {
  getAllDrills(): Drill[] {
    try {
      const data = localStorage.getItem(DRILLS_STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.error('[drillService] getAllDrills: parsed data is not an array:', parsed);
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('[drillService] getAllDrills: error parsing data:', error);
      return [];
    }
  },

  getDrillById(id: string): Drill | undefined {
    const drills = this.getAllDrills();
    return drills.find(d => d.id === id);
  },

  getDrillsByCategory(category: string): Drill[] {
    const drills = this.getAllDrills();
    return drills.filter(d => d.category === category);
  },

  async createDrill(drill: CreateDrillData): Promise<Drill> {
    try {
      // Create on backend
      const newDrill = await drillApi.create({
        name: drill.name,
        category: drill.category,
        description: drill.description,
        coachingPoints: drill.coachingPoints,
        players: drill.players,
        coaches: drill.coaches,
        dummies: drill.dummies,
        equipment: drill.equipment,
        difficulty: drill.difficulty,
        trainingContext: drill.trainingContext,
        sketchUrl: drill.sketchUrl,
        videoUrl: drill.videoUrl,
        imageUrl: drill.imageUrl,
      });

      // Normalize equipment field
      const normalizedDrill = {
        ...(newDrill as any),
        equipment: Array.isArray((newDrill as any).equipment)
          ? (newDrill as any).equipment
          : (typeof (newDrill as any).equipment === 'string'
            ? JSON.parse((newDrill as any).equipment)
            : []),
      } as Drill;

      // Update local cache
      const drills = this.getAllDrills();
      drills.push(normalizedDrill);
      localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));

      return normalizedDrill;
    } catch (error) {
      console.error('Failed to create drill on backend:', error);
      throw error;
    }
  },

  async updateDrill(id: string, updates: Partial<Omit<Drill, 'id' | 'createdAt'>>): Promise<Drill> {
    try {
      // Update on backend
      const updatedDrill = await drillApi.update(id, updates);

      // Normalize equipment field
      const normalizedDrill = {
        ...(updatedDrill as any),
        equipment: Array.isArray((updatedDrill as any).equipment)
          ? (updatedDrill as any).equipment
          : (typeof (updatedDrill as any).equipment === 'string'
            ? JSON.parse((updatedDrill as any).equipment)
            : []),
      } as Drill;

      // Update local cache
      const drills = this.getAllDrills();
      const index = drills.findIndex(d => d.id === id);
      if (index !== -1) {
        drills[index] = normalizedDrill;
        localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
      }

      return normalizedDrill;
    } catch (error) {
      console.error('Failed to update drill on backend:', error);
      throw error;
    }
  },

  async deleteDrill(id: string): Promise<boolean> {
    try {
      // Delete from backend
      await drillApi.delete(id);

      // Update local cache
      const drills = this.getAllDrills();
      const filtered = drills.filter(d => d.id !== id);
      localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error('Failed to delete drill from backend:', error);
      throw error;
    }
  },

  async uploadSketch(drillId: string, file: File): Promise<{ sketchUrl: string; sketchPublicId: string }> {
    try {
      const result = await drillApi.uploadSketch(drillId, file);

      // Update local cache with new sketch URL
      const drills = this.getAllDrills();
      const index = drills.findIndex(d => d.id === drillId);
      if (index !== -1) {
        drills[index].sketchUrl = result.sketchUrl;
        drills[index].sketchPublicId = result.sketchPublicId;
        localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
      }

      return {
        sketchUrl: result.sketchUrl,
        sketchPublicId: result.sketchPublicId,
      };
    } catch (error) {
      console.error('Failed to upload sketch to backend:', error);
      throw error;
    }
  },

  async uploadImage(drillId: string, file: File): Promise<{ imageUrl: string; imagePublicId: string }> {
    try {
      const result = await drillApi.uploadImage(drillId, file);

      // Update local cache with new image URL
      const drills = this.getAllDrills();
      const index = drills.findIndex(d => d.id === drillId);
      if (index !== -1) {
        drills[index].imageUrl = result.imageUrl;
        drills[index].imagePublicId = result.imagePublicId;
        localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
      }

      return {
        imageUrl: result.imageUrl,
        imagePublicId: result.imagePublicId,
      };
    } catch (error) {
      console.error('Failed to upload image to backend:', error);
      throw error;
    }
  },

  calculateResourceSummary(drillIds: string[]): DrillResourceSummary {
    const drills = drillIds
      .map(id => this.getDrillById(id))
      .filter((d): d is Drill => d !== undefined);

    const totalEquipment = new Map<string, number>();
    let totalCoaches = 0;
    let totalDummies = 0;
    let totalPlayers = 0;

    drills.forEach(drill => {
      // Sum up equipment with quantities
      drill.equipment.forEach(({ equipmentId, quantity }) => {
        totalEquipment.set(equipmentId, (totalEquipment.get(equipmentId) || 0) + quantity);
      });

      // Sum up personnel
      totalCoaches = Math.max(totalCoaches, drill.coaches); // Use max for coaches (not additive)
      totalDummies += drill.dummies;
      totalPlayers = Math.max(totalPlayers, drill.players); // Use max for players
    });

    return {
      totalEquipment,
      totalCoaches,
      totalDummies,
      totalPlayers,
    };
  },
};
