import { Equipment } from '../types/drill';
import { equipmentService as equipmentApi } from './api';
import { isOnline } from './sync';

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
    const data = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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

  uploadImage(file: File): Promise<string> {
    // Convert to base64 data URL
    // TODO: In production, upload to Cloudinary via backend
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
