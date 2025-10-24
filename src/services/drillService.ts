import { Drill, DrillResourceSummary } from '../types/drill';

const DRILLS_STORAGE_KEY = 'rhinos_drills';

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

  createDrill(drill: Omit<Drill, 'id' | 'createdAt'>): Drill {
    const drills = this.getAllDrills();
    const newDrill: Drill = {
      ...drill,
      id: `drill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    drills.push(newDrill);
    localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
    return newDrill;
  },

  updateDrill(id: string, updates: Partial<Omit<Drill, 'id' | 'createdAt'>>): Drill | null {
    const drills = this.getAllDrills();
    const index = drills.findIndex(d => d.id === id);
    if (index === -1) return null;

    drills[index] = { ...drills[index], ...updates };
    localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(drills));
    return drills[index];
  },

  deleteDrill(id: string): boolean {
    const drills = this.getAllDrills();
    const filtered = drills.filter(d => d.id !== id);
    if (filtered.length === drills.length) return false;

    localStorage.setItem(DRILLS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  uploadSketch(file: File): Promise<string> {
    // For now, convert to base64 data URL
    // In production, you'd upload to a cloud storage service
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
