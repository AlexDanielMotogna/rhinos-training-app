import { Equipment } from '../types/drill';

const EQUIPMENT_STORAGE_KEY = 'rhinos_equipment';

export const equipmentService = {
  getAllEquipment(): Equipment[] {
    const data = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getEquipmentById(id: string): Equipment | undefined {
    const equipment = this.getAllEquipment();
    return equipment.find(e => e.id === id);
  },

  createEquipment(name: string, quantity?: number, imageUrl?: string): Equipment {
    const equipment = this.getAllEquipment();
    const newEquipment: Equipment = {
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      quantity,
      imageUrl,
      createdAt: Date.now(),
    };
    equipment.push(newEquipment);
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    return newEquipment;
  },

  updateEquipment(id: string, name: string, quantity?: number, imageUrl?: string): Equipment | null {
    const equipment = this.getAllEquipment();
    const index = equipment.findIndex(e => e.id === id);
    if (index === -1) return null;

    equipment[index] = { ...equipment[index], name, quantity, imageUrl };
    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    return equipment[index];
  },

  uploadImage(file: File): Promise<string> {
    // Convert to base64 data URL
    // In production, you'd upload to a cloud storage service
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  deleteEquipment(id: string): boolean {
    const equipment = this.getAllEquipment();
    const filtered = equipment.filter(e => e.id !== id);
    if (filtered.length === equipment.length) return false;

    localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
