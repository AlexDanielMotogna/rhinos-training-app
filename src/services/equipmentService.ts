import { Equipment } from '../types/drill';
import { equipmentService as equipmentApi } from './api';

const EQUIPMENT_STORAGE_KEY = 'rhinos_equipment';

// ========================================
// SYNC FUNCTIONS
// ========================================

export async function syncEquipmentFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping equipment sync');
    return;
  }

  try {
    console.log('🔄 Syncing equipment from backend...');
    const backendEquipment = await equipmentApi.getAll();

    // Save in localStorage as cache
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(backendEquipment));
    console.log(`✅ Equipment synced successfully (${backendEquipment.length} items)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync equipment:', error);
  }
}

// ========================================
// LOCAL STORAGE FUNCTIONS (Cache + Offline)
// ========================================

export const equipmentService = {
  getAllEquipment(): Equipment[] {
    try {
      const data = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.error('[equipmentService] getAllEquipment: parsed data is not an array:', parsed);
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('[equipmentService] getAllEquipment: error parsing data:', error);
      return [];
    }
  },

  getEquipmentById(id: string): Equipment | undefined {
    const equipment = this.getAllEquipment();
    return equipment.find(e => e.id === id);
  },

  async createEquipment(name: string, quantity?: number, imageUrl?: string): Promise<Equipment> {
    if (isOnline()) {
      try {
        // Create on backend
        const newEquipment = await equipmentApi.create({
          name,
          quantity,
          imageUrl,
        });

        // Update local cache
        const equipment = this.getAllEquipment();
        equipment.push(newEquipment);
        localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));

        return newEquipment;
      } catch (error) {
        console.error('Failed to create equipment on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot create equipment while offline');
    }
  },

  async updateEquipment(id: string, name: string, quantity?: number, imageUrl?: string): Promise<Equipment> {
    if (isOnline()) {
      try {
        // Update on backend
        const updatedEquipment = await equipmentApi.update(id, {
          name,
          quantity,
          imageUrl,
        });

        // Update local cache
        const equipment = this.getAllEquipment();
        const index = equipment.findIndex(e => e.id === id);
        if (index !== -1) {
          equipment[index] = updatedEquipment;
          localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
        }

        return updatedEquipment;
      } catch (error) {
        console.error('Failed to update equipment on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot update equipment while offline');
    }
  },

  async uploadImage(equipmentId: string, file: File): Promise<{ imageUrl: string; imagePublicId: string }> {
    if (isOnline()) {
      try {
        const result = await equipmentApi.uploadImage(equipmentId, file);

        // Update local cache with new image URL
        const equipment = this.getAllEquipment();
        const index = equipment.findIndex(e => e.id === equipmentId);
        if (index !== -1) {
          equipment[index].imageUrl = result.imageUrl;
          equipment[index].imagePublicId = result.imagePublicId;
          localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
        }

        return {
          imageUrl: result.imageUrl,
          imagePublicId: result.imagePublicId,
        };
      } catch (error) {
        console.error('Failed to upload image to backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot upload image while offline');
    }
  },

  async deleteEquipment(id: string): Promise<boolean> {
    if (isOnline()) {
      try {
        // Delete from backend
        await equipmentApi.delete(id);

        // Update local cache
        const equipment = this.getAllEquipment();
        const filtered = equipment.filter(e => e.id !== id);
        localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(filtered));

        return true;
      } catch (error) {
        console.error('Failed to delete equipment from backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot delete equipment while offline');
    }
  },
};
