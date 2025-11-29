import { isOnline } from './online';
import { drillCategoryService as drillCategoryApi } from './api';

const DRILL_CATEGORIES_STORAGE_KEY = 'rhinos_drill_categories';

export interface DrillCategory {
  id: string;
  key?: string; // New field for unique key
  name: string;
  nameDE?: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// SYNC FUNCTIONS
// ========================================

export async function syncDrillCategoriesFromBackend(): Promise<void> {
  if (!isOnline()) {
    console.log('📦 Offline - skipping drill categories sync');
    return;
  }

  try {
    console.log('🔄 Syncing drill categories from backend...');
    const backendCategories = await drillCategoryApi.getAll() as DrillCategory[];

    // Save in localStorage as cache
    localStorage.setItem(DRILL_CATEGORIES_STORAGE_KEY, JSON.stringify(backendCategories));
    console.log(`✅ Drill categories synced successfully (${backendCategories.length} categories)`);
  } catch (error) {
    console.warn('⚠️ Failed to sync drill categories:', error);
  }
}

// ========================================
// LOCAL STORAGE FUNCTIONS (Cache + Offline)
// ========================================

export const drillCategoryService = {
  getAllCategories(): DrillCategory[] {
    try {
      const data = localStorage.getItem(DRILL_CATEGORIES_STORAGE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        console.error('[drillCategoryService] getAllCategories: parsed data is not an array:', parsed);
        return [];
      }
      return parsed;
    } catch (error) {
      console.error('[drillCategoryService] getAllCategories: error parsing data:', error);
      return [];
    }
  },

  getCategoryById(id: string): DrillCategory | undefined {
    const categories = this.getAllCategories();
    return categories.find(c => c.id === id);
  },

  async createCategory(data: { name: string; nameDE?: string; color?: string; key: string }): Promise<DrillCategory> {
    if (isOnline()) {
      try {
        // Create on backend
        const newCategory = await drillCategoryApi.create(data) as DrillCategory;

        // Update local cache
        const categories = this.getAllCategories();
        categories.push(newCategory);
        localStorage.setItem(DRILL_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));

        return newCategory;
      } catch (error) {
        console.error('Failed to create category on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot create category while offline');
    }
  },

  async updateCategory(id: string, data: { name?: string; nameDE?: string; color?: string; key?: string }): Promise<DrillCategory> {
    if (isOnline()) {
      try {
        // Update on backend
        const updatedCategory = await drillCategoryApi.update(id, data) as DrillCategory;

        // Update local cache
        const categories = this.getAllCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
          categories[index] = updatedCategory;
          localStorage.setItem(DRILL_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
        }

        return updatedCategory;
      } catch (error) {
        console.error('Failed to update category on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot update category while offline');
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    if (isOnline()) {
      try {
        // Delete from backend
        await drillCategoryApi.delete(id);

        // Update local cache
        const categories = this.getAllCategories();
        const filtered = categories.filter(c => c.id !== id);
        localStorage.setItem(DRILL_CATEGORIES_STORAGE_KEY, JSON.stringify(filtered));

        return true;
      } catch (error) {
        console.error('Failed to delete category from backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot delete category while offline');
    }
  },

  async seedCategories(): Promise<{ created: string[]; skipped: string[] }> {
    if (isOnline()) {
      try {
        // Seed on backend
        const result = await drillCategoryApi.seed() as { created: string[]; skipped: string[]; };

        // Sync to update local cache
        await syncDrillCategoriesFromBackend();

        return result;
      } catch (error) {
        console.error('Failed to seed categories on backend:', error);
        throw error;
      }
    } else {
      throw new Error('Cannot seed categories while offline');
    }
  },
};
