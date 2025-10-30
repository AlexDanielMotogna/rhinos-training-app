import { Drill, DrillResourceSummary } from '../types/drill';
import { drillService as drillApi } from './api';
import { isOnline } from './sync';

const DRILLS_STORAGE_KEY = 'rhinos_drills';

// ========================================
// SYNC FUNCTIONS
// ========================================

export async function syncDrillsFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping drills sync');
    return;
  }

  try {
    console.log('🔄 Syncing drills from backend...');
    const backendDrills = await drillApi.getAll();

    // Save in localStorage as cache
    localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(backendDrills));
    console.log(`✅ Drills synced successfully (${backendDrills.length} drills)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync drills:', error);
  }
}

// ========================================
// LOCAL STORAGE FUNCTIONS (Cache + Offline)
// ========================================

export const drillService = {
  getAllDrills(): Drill[] {
    const data = localStorage.getItem(DRILLS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getDrillById(id: string): Drill | undefined {
    const drills = this.getAllDrills();
    return drills.find(d => d.id === id);
  },

  getDrillsByCategory(category: string): Drill[] {
    const drills = this.getAllDrills();
    return drills.filter(d => d.category === category);
  },

  async createDrill(drill: Omit<Drill, 'id' | 'createdAt'>): Promise<Drill> {
    if (isOnline()) {
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
        });

        // Update local cache
        const drills = this.getAllDrills();
        drills.push(newDrill);
        localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));

        return newDrill;
      } catch (error) {
        console.error('Failed to create drill on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot create drill while offline');
    }
  },

  async updateDrill(id: string, updates: Partial<Omit<Drill, 'id' | 'createdAt'>>): Promise<Drill> {
    if (isOnline()) {
      try {
        // Update on backend
        const updatedDrill = await drillApi.update(id, updates);

        // Update local cache
        const drills = this.getAllDrills();
        const index = drills.findIndex(d => d.id === id);
        if (index !== -1) {
          drills[index] = updatedDrill;
          localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
        }

        return updatedDrill;
      } catch (error) {
        console.error('Failed to update drill on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot update drill while offline');
    }
  },

  async deleteDrill(id: string): Promise<boolean> {
    if (isOnline()) {
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
    } else {
      throw new Error('Cannot delete drill while offline');
    }
  },

  uploadSketch(file: File): Promise<string> {
    // For now, convert to base64 data URL
    // TODO: In production, upload to Cloudinary via backend
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
